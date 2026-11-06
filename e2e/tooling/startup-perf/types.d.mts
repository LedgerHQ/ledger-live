/** A row of Settings > Debug > Performance: how often the event was logged, and when. */
export interface StartupEvent {
  count: number;
  time: number;
}

/** Which launch this is: run.mjs passes it to each sample. */
export interface SampleMeta {
  scenario: string;
  /** 0 before the device swap, 1 after it. */
  phase: number;
  /** Warm-ups count down from -1. */
  round: number;
  side: "A" | "B";
  device: string;
  warmup: boolean;
}

/** One launch: a line of samples.jsonl, written by run.mjs and read by analyze.mjs. */
export interface Sample extends SampleMeta {
  platform: "android" | "ios";
  startedAt: string;
  ok: boolean;
  error?: string;
  clearedDialogs?: string[];
  screen?: unknown;
  otherPaused?: boolean;
  /** Epoch ms of the process start on the runner's clock (null when not read). */
  processStartAt?: number | null;
  /** The same instant on the clock of the app's "JS start epoch" event. */
  processStartAppClockAt?: number | null;
  pid?: number | null;
  /** `am start -W` TotalTime, Android only. */
  amStartMs?: number | null;
  /** The "App startup time" shown on the Debug screen. */
  appStartupTime?: number;
  events?: Record<string, StartupEvent>;
  readMs?: number;
  maestroCalls?: MaestroCall[];
}

export interface RunResult {
  failed: boolean;
  stdout: string;
  stderr: string;
}

export interface MaestroCall {
  command: string;
  flow: string | null;
  ms: number;
  error?: string;
}

export interface Maestro {
  /** The calls since the last reset: run.mjs keeps them with each sample. */
  calls: MaestroCall[];
  invoke(
    device: string,
    command: string,
    args: string[],
    options: { timeoutMs: number },
  ): Promise<RunResult>;
}

export interface ProcessStart {
  /** Epoch ms on the runner's clock. */
  at: number;
  /** Epoch ms on the clock the app's Date.now() uses. */
  appClockAt: number | null;
  pid: number | null;
}

/** What run.mjs needs from a device platform: android.mjs and ios.mjs implement it. */
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
