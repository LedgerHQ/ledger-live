import type { ScrollCompactionStore } from "./createScrollCompactionStore";
import {
  getNextScrollCompaction,
  INITIAL_SCROLL_COMPACTION_TRACKING,
} from "./getNextScrollCompaction";

export type ScrollMetrics = {
  readonly contentOffset: { readonly y: number };
  readonly contentSize: { readonly height: number };
  readonly layoutMeasurement: { readonly height: number };
};

/**
 * JS-thread scroll listener driving `store`, for scrollables that only report scroll through a
 * regular `onScroll` prop, such as webviews. Create one per scrollable: it keeps its own tracking.
 */
export function createScrollCompactionHandler(store: ScrollCompactionStore) {
  let tracking = INITIAL_SCROLL_COMPACTION_TRACKING;

  return ({ nativeEvent }: { readonly nativeEvent: ScrollMetrics }) => {
    const wasCompact = store.getIsCompact();
    const resetGeneration = store.getResetGeneration();
    const { isCompact, ...nextTracking } = getNextScrollCompaction(tracking, {
      offset: nativeEvent.contentOffset.y,
      maxOffset: nativeEvent.contentSize.height - nativeEvent.layoutMeasurement.height,
      isCompact: wasCompact,
      resetGeneration,
    });
    tracking = nextTracking;
    if (isCompact !== wasCompact) store.setCompact(isCompact);
  };
}
