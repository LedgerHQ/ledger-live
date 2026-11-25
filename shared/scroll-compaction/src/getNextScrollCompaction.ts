export const SCROLL_COMPACTION_TOP_OFFSET = 32;
export const SCROLL_COMPACTION_DIRECTION_THRESHOLD = 16;

export type ScrollCompactionTracking = {
  readonly lastOffset: number;
  readonly accumulatedDelta: number;
  readonly resetGeneration: number;
};

export type ScrollCompactionSample = {
  readonly offset: number;
  readonly maxOffset: number;
  readonly isCompact: boolean;
  readonly resetGeneration: number;
};

export type ScrollCompaction = ScrollCompactionTracking & { readonly isCompact: boolean };

export const INITIAL_SCROLL_COMPACTION_TRACKING: ScrollCompactionTracking = {
  lastOffset: 0,
  accumulatedDelta: 0,
  resetGeneration: 0,
};

/**
 * Compacts after a scroll down of `SCROLL_COMPACTION_DIRECTION_THRESHOLD` in one direction, expands
 * after the same scroll up or near the top. A new `resetGeneration` restarts the count from the
 * current offset. Runs on the UI thread as a Reanimated worklet too.
 */
export function getNextScrollCompaction(
  tracking: ScrollCompactionTracking,
  { offset, maxOffset, isCompact, resetGeneration }: ScrollCompactionSample,
): ScrollCompaction {
  "worklet";
  const hasBeenReset = resetGeneration !== tracking.resetGeneration;
  if (hasBeenReset) {
    return { lastOffset: Math.max(offset, 0), accumulatedDelta: 0, resetGeneration, isCompact };
  }

  if (offset <= SCROLL_COMPACTION_TOP_OFFSET) {
    return {
      lastOffset: Math.max(offset, 0),
      accumulatedDelta: 0,
      resetGeneration,
      isCompact: false,
    };
  }

  const delta = offset - tracking.lastOffset;
  const isBouncingPastContentEnd = offset > maxOffset;
  if (isBouncingPastContentEnd || delta === 0) {
    return { ...tracking, isCompact };
  }

  const keepsDirection = Math.sign(delta) === Math.sign(tracking.accumulatedDelta);
  const accumulatedDelta = keepsDirection ? tracking.accumulatedDelta + delta : delta;
  const next = { lastOffset: offset, accumulatedDelta, resetGeneration };

  if (accumulatedDelta >= SCROLL_COMPACTION_DIRECTION_THRESHOLD)
    return { ...next, isCompact: true };
  if (accumulatedDelta <= -SCROLL_COMPACTION_DIRECTION_THRESHOLD) {
    return { ...next, isCompact: false };
  }
  return { ...next, isCompact };
}
