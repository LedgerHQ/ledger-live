import { useFeature, useWalletFeaturesConfig } from "@features/platform-feature-flags";

export interface RightPanelViewModelResult {
  readonly shouldDisplay: boolean;
}

export const useRightPanelViewModel = (): RightPanelViewModelResult => {
  const { isEnabled: isWallet40Enabled } = useWalletFeaturesConfig("desktop");
  const ptxSwapLiveAppOnPortfolio = useFeature("ptxSwapLiveAppOnPortfolio");

  const shouldDisplay = isWallet40Enabled && !!ptxSwapLiveAppOnPortfolio?.enabled;

  return {
    shouldDisplay,
  };
};
