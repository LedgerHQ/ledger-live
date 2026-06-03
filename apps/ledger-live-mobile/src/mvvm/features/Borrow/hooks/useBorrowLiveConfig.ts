import { useFeature } from "@features/platform-feature-flags";

/**
 * Mobile-specific config for the Borrow Live App.
 */
export function useBorrowLiveConfig() {
  return useFeature("ptxBorrowLiveApp");
}
