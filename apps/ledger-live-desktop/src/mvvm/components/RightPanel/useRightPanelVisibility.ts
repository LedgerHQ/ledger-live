import { useFeature, useWalletFeaturesConfig } from "@features/platform-feature-flags";

export const useRightPanelVisibility = (pathname: string): boolean => {
  const { isEnabled: isWallet40Enabled } = useWalletFeaturesConfig("desktop");
  const ptxSwapLiveAppOnPortfolio = useFeature("ptxSwapLiveAppOnPortfolio");
  const ptxSwapLiveAppOnAsset = useFeature("ptxSwapLiveAppOnAsset");

  if (!isWallet40Enabled) return false;
  if (pathname === "/") return !!ptxSwapLiveAppOnPortfolio?.enabled;
  if (pathname.startsWith("/asset/")) return !!ptxSwapLiveAppOnAsset?.enabled;
  return false;
};
