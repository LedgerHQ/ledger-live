import * as path from "node:path";
import { Worker } from "node:worker_threads";
import { registerThread, threadPoll } from "@sentry/node-native-stacktrace";

/**
 * In-worker watchdog for the shard hang (QAA-1365).
 *
 * The hang is a jest worker whose event loop stops advancing. Every timeout that
 * could end the run lives on that same loop — jest's `testTimeout`, the
 * `beforeAll` timeout in setup.ts, Detox's `setupTimeout` — so none of them fire,
 * the parent waits on the dead worker forever and only the CI step's
 * `timeout-minutes` ends the job. jest upstream declined to detect stuck workers
 * (jestjs/jest#13864) but does handle dead ones (fixed in #13566).
 *
 * So this turns "stuck" into "dead": a separate thread, with its own event loop,
 * watches this one through @sentry/node-native-stacktrace and SIGKILLs the process
 * once it stops beating. jest then attributes the failure to the running spec and
 * Detox's `--retries` re-runs it (see workerWatchdog.thread.cjs).
 *
 * Set E2E_STALL_WATCHDOG=0 to disable it; E2E_STALL_MS tunes the threshold.
 */

const STALL_MS = Number(process.env.E2E_STALL_MS ?? 90_000);
const BEAT_MS = 1_000;
const THREAD_NAME = "main";

type WatchdogState = { spec: string; phase: string };

const state: WatchdogState = { spec: "<idle>", phase: "idle" };
let armed = false;

// The first argument ENABLES last-seen tracking: passing false silently turns the
// detection off. The state rides along into the watchdog's capture, so even a
// stack-less report can say which spec and phase froze.
const beat = (): void => threadPoll(true, { ...state });

// This package's lib resolves setInterval to the DOM signature (a number), but at
// runtime it is a Node timer, whose unref() keeps it from holding the worker open.
function unrefTimer(handle: unknown): void {
  if (typeof handle === "object" && handle !== null && "unref" in handle) {
    if (typeof handle.unref === "function") handle.unref();
  }
}

export function armWorkerWatchdog(): void {
  if (armed || process.env.E2E_STALL_WATCHDOG === "0") return;
  // Only a forked jest worker may be killed. In-band (local maxWorkers: 1) this
  // process is the whole run, and killing it would take Detox's cleanup with it.
  if (typeof process.send !== "function") return;
  armed = true;

  registerThread(THREAD_NAME);
  // Beat now, before anything can freeze, and then for the worker's whole life —
  // idle between spec files included. A beat tied to the spec lifecycle would make
  // an idle worker look frozen, or miss a freeze that lands before the first tick.
  beat();
  unrefTimer(setInterval(beat, BEAT_MS));

  new Worker(path.join(__dirname, "workerWatchdog.thread.cjs"), {
    workerData: {
      stallMs: STALL_MS,
      threadName: THREAD_NAME,
      reportDir: path.join(__dirname, "..", "artifacts"),
    },
  }).unref();
}

export function setWatchdogState(next: Partial<WatchdogState>): void {
  Object.assign(state, next);
  beat();
}
