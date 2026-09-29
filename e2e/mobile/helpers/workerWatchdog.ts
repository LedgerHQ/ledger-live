import * as path from "node:path";
import { Worker } from "node:worker_threads";
import type { Circus } from "@jest/types";

// Kills a jest worker whose event loop froze, see docs/stall-watchdog.md.

const STALL_MS = 90_000;
// Probe only, never merged: the perf A/B's stress arm beats every 10ms.
const BEAT_MS = Number(process.env.E2E_STALL_BEAT_MS) || 1_000;
const THREAD_NAME = "main";

type WatchdogState = { spec: string; phase: string };
type ThreadPoll = typeof import("@sentry/node-native-stacktrace").threadPoll;

const state: WatchdogState = { spec: "<idle>", phase: "idle" };
let armed = false;
let threadPoll: ThreadPoll | undefined;

const ENABLE_LAST_SEEN_TRACKING = true;
const beat = (): void => threadPoll?.(ENABLE_LAST_SEEN_TRACKING, { ...state });

function unrefTimer(handle: unknown): void {
  if (typeof handle === "object" && handle !== null && "unref" in handle) {
    if (typeof handle.unref === "function") handle.unref();
  }
}

function disable(reason: string): void {
  console.warn(`[stall-watchdog] disabled: ${reason}`);
}

export async function armWorkerWatchdog(): Promise<void> {
  const isForkedJestWorker = typeof process.send === "function";
  if (armed || !isForkedJestWorker || process.env.E2E_STALL_WATCHDOG === "0") return;
  armed = true;

  let native: typeof import("@sentry/node-native-stacktrace");
  try {
    native = await import("@sentry/node-native-stacktrace");
    native.registerThread(THREAD_NAME);
  } catch (error) {
    disable(`could not load @sentry/node-native-stacktrace (${error})`);
    return;
  }
  threadPoll = native.threadPoll;

  beat();
  unrefTimer(setInterval(beat, BEAT_MS));

  const watchdog = new Worker(path.join(__dirname, "workerWatchdog.thread.cjs"), {
    workerData: {
      stallMs: STALL_MS,
      threadName: THREAD_NAME,
      reportDir: path.join(__dirname, "..", "artifacts"),
    },
  });
  watchdog.on("error", error => disable(`watchdog thread failed (${error})`));
  watchdog.unref();
}

export function setWatchdogState(next: Partial<WatchdogState>): void {
  Object.assign(state, next);
  beat();
}

/** The phase a jest-circus event starts, if any: the label a stall report shows. */
export function watchdogPhase(event: Circus.Event, circusState: Circus.State): string | undefined {
  switch (event.name) {
    case "hook_start": {
      const { type, parent } = event.hook;
      const test = circusState.currentlyRunningTest;
      if (test && (type === "beforeEach" || type === "afterEach")) return `${type}: ${test.name}`;
      const isGlobalHook = !parent.parent;
      return isGlobalHook ? `${type} (setup.ts)` : `${type} in '${parent.name}'`;
    }
    case "test_start":
    case "test_fn_start":
      return `test: ${event.test.name}`;
    case "test_done":
      return `done: ${event.test.name}`;
    default:
      return undefined;
  }
}
