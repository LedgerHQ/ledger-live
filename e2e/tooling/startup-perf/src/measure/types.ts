// What the measurement's modules pass each other.
import type { MaestroCall } from "../types.ts";

export interface RunResult {
  failed: boolean;
  stdout: string;
  stderr: string;
}

export interface Maestro {
  /** The calls since the last reset: run.ts keeps them with each sample. */
  calls: MaestroCall[];
  invoke(options: {
    device: string;
    command: string;
    args?: string[];
    timeoutMs: number;
  }): Promise<RunResult>;
}

export interface ProcessStart {
  /** Epoch ms on the runner's clock. */
  at: number;
  /** Epoch ms on the clock the app's Date.now() uses. */
  appClockAt: number | null;
  pid: number | null;
}

/** What run.ts needs from a device platform: android.ts and ios.ts implement it. */
export interface Platform {
  install(device: string, app: string): Promise<void>;
  stop(device: string): Promise<void>;
  /** Stops Maestro's on-device driver, so the next call starts a fresh one. */
  stopDriver(device: string): Promise<void>;
  launch(
    device: string,
    launchArgs?: Record<string, string | number>,
  ): Promise<{ amStartMs?: number | null }>;
  ensureScreenOn(device: string): Promise<unknown>;
  /** The package whose ANR or crash dialog has the focus, if any. */
  blockingDialog(device: string): Promise<string | null>;
  clearDialogs(device: string): Promise<string[]>;
  /** Freezes the device for the other one's launch; false when the platform can't. */
  pause(device: string): Promise<boolean>;
  resume(device: string): Promise<void>;
  processStart(device: string): Promise<ProcessStart | null>;
  pid(device: string): Promise<number | null>;
  /** What the JavaScript of the app process `pid` wrote to the device log, its lines with `text`. */
  jsLog(device: string, pid: number, text: string): Promise<string>;
  scrollDown(device: string): Promise<void>;
  scrollToEnd(device: string): Promise<void>;
  diagnostics(device: string, file: string): Promise<void>;
}

/** The userdata files of a scenario, merged. */
export interface Userdata {
  names: string[];
  settings: Record<string, unknown>;
  accounts: Array<{ data?: { id?: string } }>;
  postOnboarding?: unknown;
}
