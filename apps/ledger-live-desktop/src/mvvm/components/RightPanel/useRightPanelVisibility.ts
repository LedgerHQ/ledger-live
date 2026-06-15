import { useFeature, useWalletFeaturesConfig } from "@features/platform-feature-flags";

export const useRightPanelVisibility = (): boolean => {
  const { isEnabled: isWallet40Enabled } = useWalletFeaturesConfig("desktop");
  const ptxSwapLiveAppOnPortfolio = useFeature("ptxSwapLiveAppOnPortfolio");

  return isWallet40Enabled && !!ptxSwapLiveAppOnPortfolio?.enabled;
};
