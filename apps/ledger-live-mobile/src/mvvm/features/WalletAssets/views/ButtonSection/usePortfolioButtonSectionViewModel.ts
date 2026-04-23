import { useWalletFeaturesConfig } from "@ledgerhq/live-common/featureFlags/index";

interface PortfolioButtonSectionViewModelResult {
  isAssetSectionEnabled: boolean;
}

export function usePortfolioButtonSectionViewModel(): PortfolioButtonSectionViewModelResult {
  const { shouldDisplayAssetSection } = useWalletFeaturesConfig("mobile");
  return { isAssetSectionEnabled: shouldDisplayAssetSection };
}
