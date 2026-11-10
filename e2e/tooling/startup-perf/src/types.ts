// What the measurement writes and the analysis reads: a line of samples.jsonl.
export type PlatformName = "android" | "ios";
export type Side = "A" | "B";

/** A row of Settings > Debug > Performance: how often the event was logged, and when. */
export interface StartupEvent {
  count: number;
  time: number;
}

/** Which launch this is: run.ts passes it to each sample. */
export interface SampleMeta {
  scenario: string;
  /** 0 before the device swap, 1 after it. */
  phase: number;
  /** Warm-ups count down from -1. */
  round: number;
  side: Side;
  device: string;
  warmup: boolean;
}

/** One launch: a line of samples.jsonl, written by run.ts and read by analyze.ts. */
export interface Sample extends SampleMeta {
  platform: PlatformName;
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
  /** The "App startup time" of the Debug screen, read from the device log or from the screen. */
  appStartupTime?: number;
  events?: Record<string, StartupEvent>;
  /**
   * Where appStartupTime and events come from: the device log line, the Debug screen (--read screen),
   * or the screen because the line never came.
   */
  readFrom?: "log" | "screen" | "screen-fallback";
  /** What the Debug screen showed, when it was read as well as the log: the two must match. */
  screenAppStartupTime?: number;
  /** Maestro read the Debug screen since the previous launch, which slows this one on iOS. */
  afterScreenRead?: boolean;
  readMs?: number;
  maestroCalls?: MaestroCall[];
}

export interface MaestroCall {
  command: string;
  flow: string | null;
  ms: number;
  error?: string;
}
