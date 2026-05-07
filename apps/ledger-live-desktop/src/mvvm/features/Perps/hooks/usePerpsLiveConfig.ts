import { useFeature } from "@features/platform-feature-flags";

/**
 * Desktop-specific config for the Perps Live App.
 */
export function usePerpsLiveConfig() {
  return useFeature("ptxPerpsLiveApp");
}
