import { useCallback, useEffect, useMemo, useRef } from "react";
import { createScrollCompactionHandler, type ScrollMetrics } from "@shared/scroll-compaction";
import { tabBarDensity } from "./tabBarDensityStore";
import { useIsTabBarDensityDriver } from "./useIsTabBarDensityDriver";

/**
 * JS-thread counterpart of `useScrollOffset({ drivesTabBarDensity })`, for scrollables that only
 * report scroll through a regular `onScroll` prop, such as live app webviews.
 */
export function useTabBarDensityScrollHandler() {
  const isTabBarDriver = useIsTabBarDensityDriver();
  const isTabBarDriverRef = useRef(isTabBarDriver);
  useEffect(() => {
    isTabBarDriverRef.current = isTabBarDriver;
  }, [isTabBarDriver]);

  const updateDensity = useMemo(() => createScrollCompactionHandler(tabBarDensity), []);

  return useCallback(
    (event: { readonly nativeEvent: ScrollMetrics }) => {
      if (isTabBarDriverRef.current) updateDensity(event);
    },
    [updateDensity],
  );
}
