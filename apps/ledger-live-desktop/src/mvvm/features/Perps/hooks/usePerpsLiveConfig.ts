import { useFeature } from "@ledgerhq/live-common/featureFlags/index";

/**
 * Desktop-specific config for the Perps Live App.
 */
export function usePerpsLiveConfig() {
  return useFeature("ptxPerpsLiveApp");
}
