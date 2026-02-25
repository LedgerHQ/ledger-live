import { useFeature, useWalletFeaturesConfig } from "@ledgerhq/live-common/featureFlags/index";

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
