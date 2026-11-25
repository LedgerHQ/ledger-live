export const TAB_BAR_EXPANDED_TOP_OFFSET = 32;
export const TAB_BAR_DIRECTION_THRESHOLD = 16;

export type TabBarScrollTracking = {
  readonly lastOffset: number;
  readonly accumulatedDelta: number;
};

export type TabBarScrollSample = {
  readonly offset: number;
  readonly maxOffset: number;
  readonly isCompact: boolean;
};

export type TabBarCompaction = TabBarScrollTracking & { readonly isCompact: boolean };

export const INITIAL_TAB_BAR_SCROLL_TRACKING: TabBarScrollTracking = {
  lastOffset: 0,
  accumulatedDelta: 0,
};

export function getNextTabBarCompaction(
  tracking: TabBarScrollTracking,
  { offset, maxOffset, isCompact }: TabBarScrollSample,
): TabBarCompaction {
  "worklet";
  if (offset <= TAB_BAR_EXPANDED_TOP_OFFSET) {
    return { lastOffset: Math.max(offset, 0), accumulatedDelta: 0, isCompact: false };
  }

  const delta = offset - tracking.lastOffset;
  const isBouncingPastContentEnd = offset > maxOffset;
  if (isBouncingPastContentEnd || delta === 0) {
    return { ...tracking, isCompact };
  }

  const keepsDirection = Math.sign(delta) === Math.sign(tracking.accumulatedDelta);
  const accumulatedDelta = keepsDirection ? tracking.accumulatedDelta + delta : delta;
  const next = { lastOffset: offset, accumulatedDelta };

  if (accumulatedDelta >= TAB_BAR_DIRECTION_THRESHOLD) return { ...next, isCompact: true };
  if (accumulatedDelta <= -TAB_BAR_DIRECTION_THRESHOLD) return { ...next, isCompact: false };
  return { ...next, isCompact };
}
