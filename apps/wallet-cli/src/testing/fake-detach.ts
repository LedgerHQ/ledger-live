import type { ChildProcess, SpawnOptions } from "node:child_process";
import { EventEmitter } from "node:events";
import { writeSync } from "node:fs";
import type { SpawnProcess } from "../agent-intent/detach";

/** A started listener: never a real process, so `kill` only records the signal and emits `exit`. */
export class FakeListener extends EventEmitter {
  killedWith: NodeJS.Signals | undefined;

  constructor(
    readonly pid: number,
    readonly command: readonly string[],
    readonly env: SpawnOptions["env"],
  ) {
    super();
  }

  kill(signal: NodeJS.Signals = "SIGTERM"): boolean {
    this.killedWith = signal;
    this.emit("exit", null, signal);
    return true;
  }

  unref(): void {
    // Nothing to release: no real process keeps the test alive.
  }
}

/**
 * Listener starter for `_setTestSpawn`: each listener writes `lines` to its log as it starts (JSON
 * for objects), then exits with `exitCode` if set, or keeps running. A listener that logs nothing
 * waits out the startup timeout, so pair it with `_setTestStartupTimeoutMs`.
 */
export class FakeListenerSpawner {
  readonly started: FakeListener[] = [];
  lines: (string | object)[] = [];
  exitCode: number | undefined;

  constructor(readonly pid = 4242) {}

  readonly spawn: SpawnProcess = (file, args, options) => {
    const child = new FakeListener(this.pid, [file, ...args], options.env);
    this.started.push(child);
    const [, logFd] = options.stdio as [unknown, number, number];
    for (const line of this.lines) {
      writeSync(logFd, `${typeof line === "string" ? line : JSON.stringify(line)}\n`);
    }
    const { exitCode } = this;
    // After the caller has subscribed, as a real exit would be.
    if (exitCode !== undefined) setImmediate(() => child.emit("exit", exitCode, null));
    return child as unknown as ChildProcess;
  };
}
