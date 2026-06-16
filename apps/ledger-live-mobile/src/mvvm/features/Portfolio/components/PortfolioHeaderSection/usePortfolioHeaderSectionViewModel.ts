import { useState, useCallback } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useWalletFeaturesConfig } from "@features/platform-feature-flags";
import {
  CONTENT_AREA_HEIGHT,
  MIN_CONTENT_AREA_HEIGHT,
  OS_UPDATE_BANNER_TOP_GAP,
} from "LLM/components/ScreenHeroSection/constants";

interface PortfolioHeaderSectionViewModel {
  readonly safeAreaTop: number;
  readonly shouldDisplayBalanceRefreshRework: boolean;
  readonly onBannerHeightChange: (height: number) => void;
  readonly minContentHeight: number | undefined;
  readonly bannerTopInset: number;
}

export function usePortfolioHeaderSectionViewModel(): PortfolioHeaderSectionViewModel {
  const { top: safeAreaTop } = useSafeAreaInsets();
  const { shouldDisplayBalanceRefreshRework, shouldDisplayWallet40MainNav } =
    useWalletFeaturesConfig("mobile");

  const [bannerHeight, setBannerHeight] = useState(0);
  const onBannerHeightChange = useCallback((height: number) => {
    setBannerHeight(height);
  }, []);

  // Clear the floating Wallet 4.0 TopBar when a banner is shown.
  const bannerTopInset =
    shouldDisplayWallet40MainNav && bannerHeight > 0 ? OS_UPDATE_BANNER_TOP_GAP : 0;

  // Shrink the hero by the banner height (floored) so total header height stays ~constant.
  const minContentHeight =
    bannerHeight > 0
      ? Math.max(MIN_CONTENT_AREA_HEIGHT, CONTENT_AREA_HEIGHT - bannerHeight)
      : undefined;

  return {
    safeAreaTop,
    shouldDisplayBalanceRefreshRework,
    onBannerHeightChange,
    minContentHeight,
    bannerTopInset,
  };
}
