import { useFeature } from "@ledgerhq/live-common/featureFlags/index";

/**
 * Desktop-specific config for the Borrow Live App.
 */
export function useBorrowLiveConfig() {
  return useFeature("ptxBorrowLiveApp");
}
