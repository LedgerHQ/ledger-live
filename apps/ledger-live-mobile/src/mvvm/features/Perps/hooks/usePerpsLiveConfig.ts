import { useFeature } from "@features/platform-feature-flags";

/**
 * Mobile-specific config for the Perps Live App.
 */
export function usePerpsLiveConfig() {
  return useFeature("ptxPerpsLiveAppMobile");
}
