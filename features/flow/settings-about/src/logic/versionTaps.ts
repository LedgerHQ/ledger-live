export const VERSION_TAPS_TO_UNLOCK = 5;

export type VersionTapState = Readonly<{ count: number; unlocked: boolean }>;

/** Counts a tap on the version row. `unlocked` is true only on the tap that reaches the threshold. */
export function nextVersionTapState(count: number): VersionTapState {
  if (count >= VERSION_TAPS_TO_UNLOCK) return { count, unlocked: false };
  const next = count + 1;
  return { count: next, unlocked: next === VERSION_TAPS_TO_UNLOCK };
}
