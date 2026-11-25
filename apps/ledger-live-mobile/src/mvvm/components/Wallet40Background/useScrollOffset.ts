import type { NativeScrollEvent } from "react-native";
import {
  useAnimatedScrollHandler,
  useSharedValue,
  type SharedValue,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import {
  getNextScrollCompaction,
  INITIAL_SCROLL_COMPACTION_TRACKING,
  type ScrollCompactionTracking,
} from "@shared/scroll-compaction";
import {
  setTabBarCompact,
  tabBarCompactOnUI,
  tabBarResetGenerationOnUI,
} from "LLM/components/MainTabBar/tabBarDensityStore";

type UseScrollOffsetOptions = {
  readonly drivesTabBarDensity?: boolean;
};

function updateTabBarDensity(
  tracking: SharedValue<ScrollCompactionTracking>,
  event: Pick<NativeScrollEvent, "contentOffset" | "contentSize" | "layoutMeasurement">,
) {
  "worklet";
  const resetGeneration = tabBarResetGenerationOnUI.value;
  const { isCompact, ...nextTracking } = getNextScrollCompaction(tracking.value, {
    offset: event.contentOffset.y,
    maxOffset: event.contentSize.height - event.layoutMeasurement.height,
    isCompact: tabBarCompactOnUI.value,
    resetGeneration,
  });
  tracking.value = nextTracking;
  if (isCompact !== tabBarCompactOnUI.value) {
    tabBarCompactOnUI.value = isCompact;
    scheduleOnRN(setTabBarCompact, isCompact, resetGeneration);
  }
}

/**
 * Tracks a scrollable's vertical offset on the UI thread.
 * Pass `scrollY` to write into an existing shared value (e.g. one from a context).
 * Set `drivesTabBarDensity` on tab root screens to compact the main tab bar while scrolling down.
 */
export function useScrollOffset(
  scrollY?: SharedValue<number>,
  { drivesTabBarDensity = false }: UseScrollOffsetOptions = {},
) {
  const ownScrollY = useSharedValue(0);
  const offset = scrollY ?? ownScrollY;
  const tabBarScrollTracking = useSharedValue(INITIAL_SCROLL_COMPACTION_TRACKING);

  const onScroll = useAnimatedScrollHandler(event => {
    offset.value = event.contentOffset.y;
    if (drivesTabBarDensity) {
      updateTabBarDensity(tabBarScrollTracking, event);
    }
  });
  return { scrollY: offset, onScroll };
}
