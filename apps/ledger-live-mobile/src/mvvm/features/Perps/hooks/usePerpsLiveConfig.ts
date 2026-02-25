import useFeature from "@ledgerhq/live-common/featureFlags/useFeature";

/**
 * Mobile-specific config for the Perps Live App.
 */
export function usePerpsLiveConfig() {
  return useFeature("ptxPerpsLiveAppMobile");
}
