import type { ReactNode } from "react";

/** The props contract of Karaoke, the same on every platform. */
export type KaraokeRootProps = Readonly<{
  /** Shown one at a time; the user taps to see the next one. */
  phrases: readonly string[];
  /** The "tap to continue" hint, also read by screen readers. */
  tapLabel: string;
  /** Replaces the tap hint on the last phrase, and keeps the sequence on screen. */
  action?: ReactNode;
  testID?: string;
  /** Sequence, Final, then anything that must sit above the tap area (a close bar). */
  children: ReactNode;
}>;

export type KaraokeFinalProps = Readonly<{
  /** Replaces the sequence after the last tap. */
  children: ReactNode;
}>;
