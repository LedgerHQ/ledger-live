import { useMemo } from "react";
import { createScrollCompactionHandler } from "@shared/scroll-compaction";
import { tabBarDensity } from "./tabBarDensityStore";

/**
 * JS-thread counterpart of `useScrollOffset({ drivesTabBarDensity })`, for scrollables that only
 * report scroll through a regular `onScroll` prop, such as live app webviews.
 */
export function useTabBarDensityScrollHandler() {
  return useMemo(() => createScrollCompactionHandler(tabBarDensity), []);
}
