import { useFeature } from "@features/platform-feature-flags";

export const useSwapVisibility = (): boolean => {
  const ptxSwapLiveAppOnPortfolio = useFeature("ptxSwapLiveAppOnPortfolio");

  return !!ptxSwapLiveAppOnPortfolio?.enabled;
};
