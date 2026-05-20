import { useSelector } from "react-redux";
import type { WithFeatureFlags, Features } from "@shared/feature-flags";

/**
 * Hook to select the resolved feature flags state.
 *
 * @returns
 * The resolved feature flags state.
 */
export function useFeatureFlags(): Features {
  return useSelector((state: WithFeatureFlags) => state.featureFlags.resolved);
}
