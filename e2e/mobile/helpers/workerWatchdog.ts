import * as path from "node:path";
import { Worker } from "node:worker_threads";
import type { Circus } from "@jest/types";

// Kills a jest worker whose event loop froze, see docs/stall-watchdog.md.

const STALL_MS = 90_000;
const BEAT_MS = 1_000;

type WatchdogState = { spec: string; phase: string };

const state: WatchdogState = { spec: "<idle>", phase: "idle" };
let watchdog: Worker | undefined;

const beat = (): void => watchdog?.postMessage(state);

function unrefTimer(handle: unknown): void {
  if (typeof handle === "object" && handle !== null && "unref" in handle) {
    if (typeof handle.unref === "function") handle.unref();
  }
}

function disable(reason: string): void {
  console.warn(`[stall-watchdog] disabled: ${reason}`);
}

export function armWorkerWatchdog(): void {
  const isForkedJestWorker = typeof process.send === "function";
  if (watchdog || !isForkedJestWorker || process.env.E2E_STALL_WATCHDOG === "0") return;

  watchdog = new Worker(path.join(__dirname, "workerWatchdog.thread.cjs"), {
    workerData: { stallMs: STALL_MS, reportDir: path.join(__dirname, "..", "artifacts") },
  });
  watchdog.on("error", error => disable(`watchdog thread failed (${error})`));
  watchdog.unref();

  beat();
  unrefTimer(setInterval(beat, BEAT_MS));
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
