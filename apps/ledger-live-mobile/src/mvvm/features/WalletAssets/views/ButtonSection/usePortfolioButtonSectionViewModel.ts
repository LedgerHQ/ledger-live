import { useWalletFeaturesConfig } from "@features/platform-feature-flags";

interface PortfolioButtonSectionViewModelResult {
  isAssetSectionEnabled: boolean;
}

export function usePortfolioButtonSectionViewModel(): PortfolioButtonSectionViewModelResult {
  const { shouldDisplayAssetSection } = useWalletFeaturesConfig("mobile");
  return { isAssetSectionEnabled: shouldDisplayAssetSection };
}
