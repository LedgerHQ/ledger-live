import { useState, useCallback } from "react";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useWalletFeaturesConfig } from "@ledgerhq/live-common/featureFlags/index";
import { CONTENT_AREA_HEIGHT } from "LLM/components/ScreenHeroSection/constants";

interface PortfolioHeaderSectionViewModel {
  readonly safeAreaTop: number;
  readonly shouldDisplayBalanceRefreshRework: boolean;
  readonly onBannerHeightChange: (height: number) => void;
  readonly minContentHeight: number | undefined;
}

export function usePortfolioHeaderSectionViewModel(): PortfolioHeaderSectionViewModel {
  const { top: safeAreaTop } = useSafeAreaInsets();
  const { shouldDisplayBalanceRefreshRework } = useWalletFeaturesConfig("mobile");

  const [bannerHeight, setBannerHeight] = useState(0);
  const onBannerHeightChange = useCallback((height: number) => {
    setBannerHeight(height);
  }, []);

  // When the OS update banner is visible, shrink the hero section by the banner's actual height
  // so the total portfolio header height (banner + hero) stays constant at CONTENT_AREA_HEIGHT.
  const minContentHeight =
    bannerHeight > 0 ? Math.max(0, CONTENT_AREA_HEIGHT - bannerHeight) : undefined;

  return { safeAreaTop, shouldDisplayBalanceRefreshRework, onBannerHeightChange, minContentHeight };
}
