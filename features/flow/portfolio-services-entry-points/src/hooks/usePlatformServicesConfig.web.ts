import { useFeature, useWalletFeaturesConfig } from "@features/platform-feature-flags";
import type { PlatformServicesConfig } from "../types.internals";

export function usePlatformServicesConfig(): PlatformServicesConfig {
  const perps = useFeature("ptxPerpsLiveApp");
  const borrow = useFeature("ptxBorrowLiveApp");
  const { shouldDisplayAssetSection } = useWalletFeaturesConfig("desktop");

  return {
    availability: {
      perps: perps?.enabled ?? false,
      borrow: borrow?.enabled ?? false,
    },
    isAssetSectionDisplayed: shouldDisplayAssetSection,
  };
}
