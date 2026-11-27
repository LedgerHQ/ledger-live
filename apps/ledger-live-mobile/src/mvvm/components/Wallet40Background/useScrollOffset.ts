import { useEffect } from "react";
import {
  useAnimatedScrollHandler,
  useSharedValue,
  type SharedValue,
} from "react-native-reanimated";
import { INITIAL_SCROLL_COMPACTION_TRACKING } from "@shared/scroll-compaction";
import { updateTabBarDensityOnUI } from "LLM/components/MainTabBar/updateTabBarDensityOnUI";
import { useIsTabBarDensityDriver } from "LLM/components/MainTabBar/useIsTabBarDensityDriver";

type UseScrollOffsetOptions = {
  readonly drivesTabBarDensity?: boolean;
};

/**
 * Tracks a scrollable's vertical offset on the UI thread.
 * Pass `scrollY` to write into an existing shared value (e.g. one from a context).
 */
export function useScrollOffset(
  scrollY?: SharedValue<number>,
  { drivesTabBarDensity = false }: UseScrollOffsetOptions = {},
) {
  const ownScrollY = useSharedValue(0);
  const offset = scrollY ?? ownScrollY;
  const tabBarScrollTracking = useSharedValue(INITIAL_SCROLL_COMPACTION_TRACKING);
  const isTabBarDriver = useIsTabBarDensityDriver();
  const shouldDriveTabBarDensity = drivesTabBarDensity && isTabBarDriver;
  const drivesTabBarDensityOnUI = useSharedValue(shouldDriveTabBarDensity);
  useEffect(() => {
    drivesTabBarDensityOnUI.value = shouldDriveTabBarDensity;
  }, [shouldDriveTabBarDensity, drivesTabBarDensityOnUI]);

  const onScroll = useAnimatedScrollHandler(event => {
    offset.value = event.contentOffset.y;
    if (drivesTabBarDensityOnUI.value) {
      updateTabBarDensityOnUI(tabBarScrollTracking, event);
    }
  });
  return { scrollY: offset, onScroll };
}
