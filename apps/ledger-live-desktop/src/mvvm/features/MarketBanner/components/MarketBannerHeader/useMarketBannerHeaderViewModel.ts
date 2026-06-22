import { useWalletFeaturesConfig } from "@features/platform-feature-flags";

export function useMarketBannerHeaderViewModel() {
  const { shouldDisplayAssetDiscoverability } = useWalletFeaturesConfig("desktop");

  return { shouldDisplayAssetDiscoverability };
}
