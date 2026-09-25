import * as path from "node:path";
import { Worker } from "node:worker_threads";

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
 * It arms only in forked workers, so in-band runs (the local default, maxWorkers: 1)
 * are never watched. A forked worker paused in a debugger for longer than STALL_MS
 * looks frozen and is killed: set E2E_STALL_WATCHDOG=0 to debug with several workers.
 */

// Well above the longest a healthy worker blocks its loop (GC, loading a spec's
// modules), well below the step timeout: a frozen spec costs ~1.5 min, not the shard.
const STALL_MS = 90_000;
const BEAT_MS = 1_000;
const THREAD_NAME = "main";

type WatchdogState = { spec: string; phase: string };
type ThreadPoll = typeof import("@sentry/node-native-stacktrace").threadPoll;

const state: WatchdogState = { spec: "<idle>", phase: "idle" };
let armed = false;
let threadPoll: ThreadPoll | undefined;

// The first argument ENABLES last-seen tracking: passing false silently turns the
// detection off. The state rides along into the watchdog's capture, so even a
// stack-less report can say which spec and phase froze.
const beat = (): void => threadPoll?.(true, { ...state });

// This package's lib resolves setInterval to the DOM signature (a number), but at
// runtime it is a Node timer, whose unref() keeps it from holding the worker open.
function unrefTimer(handle: unknown): void {
  if (typeof handle === "object" && handle !== null && "unref" in handle) {
    if (typeof handle.unref === "function") handle.unref();
  }
}

// The watchdog must never be the reason a suite cannot run, so every failure of
// its own is reported and swallowed, leaving the run unwatched rather than broken.
function disable(reason: string): void {
  console.warn(`[stall-watchdog] disabled: ${reason}`);
}

export async function armWorkerWatchdog(): Promise<void> {
  if (armed || process.env.E2E_STALL_WATCHDOG === "0") return;
  // Only a forked jest worker may be killed. In-band (local maxWorkers: 1) this
  // process is the whole run, and killing it would take Detox's cleanup with it.
  if (typeof process.send !== "function") return;
  armed = true;

  // Loaded here rather than at the top of the file, so that a missing or
  // unloadable native binary (an unsupported platform or Node ABI) disables the
  // watchdog instead of failing every spec at import time.
  let native: typeof import("@sentry/node-native-stacktrace");
  try {
    native = await import("@sentry/node-native-stacktrace");
    native.registerThread(THREAD_NAME);
  } catch (error) {
    disable(`could not load @sentry/node-native-stacktrace (${error})`);
    return;
  }
  threadPoll = native.threadPoll;

  // Beat now, before anything can freeze, and then for the worker's whole life —
  // idle between spec files included. A beat tied to the spec lifecycle would make
  // an idle worker look frozen, or miss a freeze that lands before the first tick.
  beat();
  unrefTimer(setInterval(beat, BEAT_MS));

  const watchdog = new Worker(path.join(__dirname, "workerWatchdog.thread.cjs"), {
    workerData: {
      stallMs: STALL_MS,
      threadName: THREAD_NAME,
      reportDir: path.join(__dirname, "..", "artifacts"),
    },
  });
  // Without a listener, an error thrown in the thread would be re-raised in this
  // worker's main thread and crash the very process being protected.
  watchdog.on("error", error => disable(`watchdog thread failed (${error})`));
  watchdog.unref();
}

export function setWatchdogState(next: Partial<WatchdogState>): void {
  Object.assign(state, next);
  beat();
}
