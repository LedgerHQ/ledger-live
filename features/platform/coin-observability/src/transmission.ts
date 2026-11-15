import type { CoinModuleCallEvent } from "./coinModuleCall";
import {
  DEFAULT_PREPARATION_SAMPLE_RATE,
  DEFAULT_SYNC_PATH_SAMPLE_RATE,
  type CoinModuleCallTransmissionConfig,
} from "./config";

/**
 * Methods on the transaction path: called once per transaction the user sends, so every call is
 * worth sending.
 */
const TRANSACTION_PATH_METHODS = new Set([
  "craftTransaction",
  "craftRawTransaction",
  "craftTransactionData",
  "combine",
  "broadcast",
]);

/**
 * Methods that prepare a transaction: the bridge calls them again on every edit of the
 * transaction and to compute the max spendable amount, often without a send at the end, so they
 * are sampled with their own rate. Everything else runs on the sync path — per account, per sync
 * cycle — and is sampled too.
 */
const PREPARATION_METHODS = new Set(["estimateFees", "validateIntent"]);

const isSyncPath = (method: string): boolean =>
  !TRANSACTION_PATH_METHODS.has(method) && !PREPARATION_METHODS.has(method);

const FAILURE_WINDOW_MS = 60 * 60 * 1000;

// Resolved at call time rather than captured as default values: a transmitter is built at module
// load, and a captured `Math.random` would ignore any later stub of it.
const defaultRandom = (): number => Math.random();
const defaultClock = (): number => Date.now();

type SampleRates = { syncPathSampleRate?: number; preparationSampleRate?: number };

/**
 * Share of app sessions whose successes of `method` are sent: 1 on the transaction path, the
 * preparation rate for `estimateFees` and `validateIntent`, the sync-path rate for everything else.
 */
export function sampleRateFor(
  method: string,
  {
    syncPathSampleRate = DEFAULT_SYNC_PATH_SAMPLE_RATE,
    preparationSampleRate = DEFAULT_PREPARATION_SAMPLE_RATE,
  }: SampleRates = {},
): number {
  if (TRANSACTION_PATH_METHODS.has(method)) return 1;
  if (PREPARATION_METHODS.has(method)) return preparationSampleRate;
  return syncPathSampleRate;
}

/**
 * Default transmission policy for a sink that leaves the process: every failure and every
 * transaction-path call, and a sample of the preparation and sync-path successes. The volume and
 * latency of sampled methods are estimated from the sample.
 */
export function shouldTransmitCoinModuleCall(
  event: CoinModuleCallEvent,
  { random = defaultRandom, ...rates }: SampleRates & { random?: () => number } = {},
): boolean {
  if (event.status === "failure") return true;
  const sampleRate = sampleRateFor(event.method, rates);
  return sampleRate >= 1 || random() < sampleRate;
}

/**
 * What a sink sends with a transmitted call, so that a dashboard can correct for sampling.
 *
 * A failure is sent from every session, a success only from the sessions in the sample, so the
 * raw logs overstate the failure rate of a sampled method. Restricting both to `inSample` gives an
 * unbiased rate, and dividing a count of successes by `sampleRate` estimates the real volume.
 */
export type CoinModuleCallSampling = {
  /** Share of app sessions that send this method's successes; 1 on the transaction path. */
  sampleRate: number;
  /** Whether this session is in the sample for this method. Always true for a sent success. */
  inSample: boolean;
};

/**
 * Builds the stateful transmission policy a sink applies: {@link shouldTransmitCoinModuleCall}
 * plus a cap on failures.
 *
 * Sampling is drawn once per transmitter, so once per app session, not per event: a session sends
 * all of its successes of a sampled tier or none of them, and a sampled session can be followed
 * call by call. Both tiers compare the same draw with their own rate, read on every event, so a
 * rate change still applies at once.
 * Without the cap, a node outage makes every active client send a
 * failure per call and per sync cycle; with it, each client sends at most `maxFailuresPerKey`
 * per hour for a given method, currency and error, which still shows the outage and how wide it
 * is. Past the cap the failure rate is therefore a lower bound, not an exact count.
 *
 * `readConfig` is read on every event, so a remote flag change applies at once. Returning `null`
 * disables transmission entirely.
 *
 * Returns the sampling attributes to send with the call, or `null` when the call is dropped.
 */
export function createCoinModuleCallTransmitter(
  readConfig: () => CoinModuleCallTransmissionConfig | null,
  { random = defaultRandom, clock = defaultClock } = {},
): (event: CoinModuleCallEvent) => CoinModuleCallSampling | null {
  const failures = new Map<string, { count: number; windowStart: number }>();
  // Drawn on first use rather than here: a sink builds its transmitter at module load.
  let sessionDraw: number | undefined;
  const sessionRandom = (): number => (sessionDraw ??= random());

  return event => {
    const config = readConfig();
    if (!config) return null;
    if (!config.includeSyncPath && isSyncPath(event.method)) return null;

    const sampleRate = sampleRateFor(event.method, config);
    const sampling = { sampleRate, inSample: sampleRate >= 1 || sessionRandom() < sampleRate };
    if (event.status !== "failure") return sampling.inSample ? sampling : null;

    const key = `${event.network}/${event.method}/${event.errorName ?? ""}`;
    const at = clock();
    const entry = failures.get(key);
    if (!entry || at - entry.windowStart >= FAILURE_WINDOW_MS) {
      failures.set(key, { count: 1, windowStart: at });
      return config.maxFailuresPerKey > 0 ? sampling : null;
    }
    entry.count += 1;
    return entry.count <= config.maxFailuresPerKey ? sampling : null;
  };
}
