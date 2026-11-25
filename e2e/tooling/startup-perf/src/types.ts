// What the measurement writes and the analysis reads: a line of samples.jsonl.
export type PlatformName = "android" | "ios";
export type Side = "A" | "B";

/** A startup event the app writes to the device log: how often it was logged, and when. */
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
  /** The App startup time the Debug screen shows, as the app writes it to the device log. */
  appStartupTime?: number;
  events?: Record<string, StartupEvent>;
  /** From the end of the settle time to the startup lines read from the device log. */
  readMs?: number;
}
