import type { CoinModuleCallEvent } from "./coinModuleCall";
import { DEFAULT_SYNC_PATH_SAMPLE_RATE, type CoinModuleCallTransmissionConfig } from "./config";

/**
 * Methods on the transaction path: called a handful of times per user action, so every call is
 * worth sending. Everything else runs on the sync path — per account, per sync cycle — and is
 * sampled.
 */
const TRANSACTION_PATH_METHODS = new Set([
  "craftTransaction",
  "craftRawTransaction",
  "estimateFees",
  "combine",
  "broadcast",
  "validateIntent",
]);

const FAILURE_WINDOW_MS = 60 * 60 * 1000;

// Resolved at call time rather than captured as default values: a transmitter is built at module
// load, and a captured `Math.random` would ignore any later stub of it.
const defaultRandom = (): number => Math.random();
const defaultClock = (): number => Date.now();

/**
 * Default transmission policy for a sink that leaves the process: every failure and every
 * transaction-path call, and a sample of the sync-path successes. The failure rate stays exact
 * per method; only sync-path volume and latency are estimated from the sample.
 */
export function shouldTransmitCoinModuleCall(
  event: CoinModuleCallEvent,
  { syncPathSampleRate = DEFAULT_SYNC_PATH_SAMPLE_RATE, random = defaultRandom } = {},
): boolean {
  if (event.status === "failure") return true;
  if (TRANSACTION_PATH_METHODS.has(event.method)) return true;
  return random() < syncPathSampleRate;
}

/**
 * Builds the stateful transmission policy a sink applies: {@link shouldTransmitCoinModuleCall}
 * plus a cap on failures.
 *
 * Sync-path sampling is drawn once per transmitter, so once per app session, not per event: a
 * session sends all of its sync-path successes or none of them, and a sampled session can be
 * followed call by call. The draw is compared with the configured rate on every event, so a rate
 * change still applies at once.
 * Without the cap, a node outage makes every active client send a
 * failure per call and per sync cycle; with it, each client sends at most `maxFailuresPerKey`
 * per hour for a given method, currency and error, which still shows the outage and how wide it
 * is. Past the cap the failure rate is therefore a lower bound, not an exact count.
 *
 * `readConfig` is read on every event, so a remote flag change applies at once. Returning `null`
 * disables transmission entirely.
 */
export function createCoinModuleCallTransmitter(
  readConfig: () => CoinModuleCallTransmissionConfig | null,
  { random = defaultRandom, clock = defaultClock } = {},
): (event: CoinModuleCallEvent) => boolean {
  const failures = new Map<string, { count: number; windowStart: number }>();
  // Drawn on first use rather than here: a sink builds its transmitter at module load.
  let sessionDraw: number | undefined;
  const sessionRandom = (): number => (sessionDraw ??= random());

  return event => {
    const config = readConfig();
    if (!config) return false;
    if (!config.includeSyncPath && !TRANSACTION_PATH_METHODS.has(event.method)) return false;
    if (event.status !== "failure") {
      return shouldTransmitCoinModuleCall(event, {
        syncPathSampleRate: config.syncPathSampleRate,
        random: sessionRandom,
      });
    }

    const key = `${event.network}/${event.method}/${event.errorName ?? ""}`;
    const at = clock();
    const entry = failures.get(key);
    if (!entry || at - entry.windowStart >= FAILURE_WINDOW_MS) {
      failures.set(key, { count: 1, windowStart: at });
      return config.maxFailuresPerKey > 0;
    }
    entry.count += 1;
    return entry.count <= config.maxFailuresPerKey;
  };
}
