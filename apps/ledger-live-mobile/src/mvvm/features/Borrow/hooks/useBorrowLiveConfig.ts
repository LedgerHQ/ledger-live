import useFeature from "@ledgerhq/live-common/featureFlags/useFeature";

/**
 * Mobile-specific config for the Borrow Live App.
 */
export function useBorrowLiveConfig() {
  return useFeature("ptxBorrowLiveApp");
}
