import * as fs from "node:fs";
import * as path from "node:path";

/**
 * Liveness signal for the stall watchdog (QAA-1365).
 *
 * The shard hang is a jest worker whose event loop stops advancing. Every timer
 * that could end the run lives on that same loop — jest's `testTimeout`, the
 * `beforeAll` timeout in setup.ts, Detox's `setupTimeout` — so none of them fire,
 * the parent waits on the dead worker forever, `--forceExit` is never reached and
 * only the CI step's `timeout-minutes` ends the job.
 *
 * A ticker is therefore the detector: while the loop turns it rewrites this file
 * every few seconds, and when the loop freezes the file simply stops changing.
 * `scripts/stall-watchdog.mjs`, a separate process, watches for that.
 *
 * `lastProgressAt` covers the other conceivable shape — a loop that still turns
 * but makes no test progress — under a much longer threshold.
 */

const TICK_MS = Number(process.env.E2E_HEARTBEAT_TICK_MS ?? 5_000);

export const heartbeatDir = (): string =>
  process.env.E2E_HEARTBEAT_DIR ?? path.join(__dirname, "..", "artifacts", ".heartbeats");

export type Heartbeat = {
  pid: number;
  /**
   * Workers are forked and have an IPC channel; an in-band run (local
   * `maxWorkers: 1`) does not. Only a worker can be killed without taking the
   * whole run — and Detox's retry — down with it.
   */
  killable: boolean;
  testPath: string;
  phase: string;
  /** Bumped by the ticker: proves the event loop is turning. */
  updatedAt: number;
  /** Bumped at test boundaries: proves the run is making progress. */
  lastProgressAt: number;
};

// This package's lib resolves setInterval to the DOM signature (a number), so the
// handle is inferred rather than typed as NodeJS.Timeout, and unref is optional.
type Ticker = ReturnType<typeof setInterval> & { unref?: () => void };

let ticker: Ticker | undefined;
let current: Heartbeat | undefined;

const heartbeatFile = (pid: number): string => path.join(heartbeatDir(), `worker-${pid}.json`);

/** Bookkeeping must never break a test run, so every write is best-effort. */
function flush(): void {
  if (!current) return;
  try {
    const target = heartbeatFile(current.pid);
    const temp = `${target}.tmp`;
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(temp, JSON.stringify(current));
    // Rename so the watchdog can never read a half-written file.
    fs.renameSync(temp, target);
  } catch {
    // ignore
  }
}

export function startHeartbeat(testPath: string): void {
  const now = Date.now();
  current = {
    pid: process.pid,
    killable: typeof process.send === "function",
    testPath,
    phase: "setup",
    updatedAt: now,
    lastProgressAt: now,
  };
  flush();

  ticker = setInterval(() => {
    if (!current) return;
    current.updatedAt = Date.now();
    flush();
  }, TICK_MS) as Ticker;
  // Jest decides when the worker exits; the ticker must not hold it open.
  ticker.unref?.();
}

export function markHeartbeat(phase: string, progressed = true): void {
  if (!current) return;
  current.phase = phase;
  current.updatedAt = Date.now();
  if (progressed) current.lastProgressAt = current.updatedAt;
  flush();
}

export function stopHeartbeat(): void {
  if (ticker) {
    clearInterval(ticker);
    ticker = undefined;
  }
  const pid = current?.pid;
  current = undefined;
  if (pid === undefined) return;
  try {
    fs.rmSync(heartbeatFile(pid), { force: true });
  } catch {
    // ignore
  }
}
