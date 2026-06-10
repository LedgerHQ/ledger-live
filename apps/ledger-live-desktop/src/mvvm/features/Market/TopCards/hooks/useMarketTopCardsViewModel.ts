import { useWalletFeaturesConfig } from "@features/platform-feature-flags";

export function useMarketTopCardsViewModel() {
  const { shouldDisplayAssetDiscoverability } = useWalletFeaturesConfig("desktop");

  return { shouldRender: shouldDisplayAssetDiscoverability };
}
