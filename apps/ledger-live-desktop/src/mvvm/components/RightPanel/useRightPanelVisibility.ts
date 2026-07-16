import { useFeature } from "@features/platform-feature-flags";

export const useRightPanelVisibility = (): boolean => {
  const ptxSwapLiveAppOnPortfolio = useFeature("ptxSwapLiveAppOnPortfolio");

  return !!ptxSwapLiveAppOnPortfolio?.enabled;
};
