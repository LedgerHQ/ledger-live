import { useCallback, useRef } from "react";
import type { NativeScrollEvent } from "react-native";
import {
  getNextTabBarCompaction,
  INITIAL_TAB_BAR_SCROLL_TRACKING,
} from "./getNextTabBarCompaction";
import { getIsTabBarCompact, setTabBarCompact } from "./tabBarDensityStore";

type ScrollMetricsEvent = {
  readonly nativeEvent: Pick<
    NativeScrollEvent,
    "contentOffset" | "contentSize" | "layoutMeasurement"
  >;
};

/**
 * JS-thread counterpart of `useScrollOffset({ drivesTabBarDensity })`, for scrollables that only
 * report scroll through a regular `onScroll` prop, such as live app webviews.
 */
export function useTabBarDensityScrollHandler() {
  const tracking = useRef(INITIAL_TAB_BAR_SCROLL_TRACKING);

  return useCallback(({ nativeEvent }: ScrollMetricsEvent) => {
    const { isCompact, ...nextTracking } = getNextTabBarCompaction(tracking.current, {
      offset: nativeEvent.contentOffset.y,
      maxOffset: nativeEvent.contentSize.height - nativeEvent.layoutMeasurement.height,
      isCompact: getIsTabBarCompact(),
    });
    tracking.current = nextTracking;
    setTabBarCompact(isCompact);
  }, []);
}
