import { useCallback, useState } from "react";
import { NativeSyntheticEvent, NativeScrollEvent } from "react-native";
import { useWalletFeaturesConfig } from "@features/platform-feature-flags";
import { useTopWalletHasDisplayableContentCards } from "~/dynamicContent/useTopWalletHasDisplayableContentCards";
import { useOnboardingWidgetVisibility } from "../../hooks/useOnboardingWidgetVisibility";
import useShouldDisplayRecoverBanner from "../RecoverBanner/useShouldDisplayRecoverBanner";

interface PortfolioBannersSectionViewModelParams {
  readonly showAssets?: boolean;
}

interface PortfolioBannersSectionViewModelResult {
  readonly sectionMarginTop: "s8" | "s12" | "s16" | "s32";
  readonly hasAssets: boolean;
  readonly shouldShowOnboardingWidget: boolean;
  readonly shouldDisplayRecover: boolean;
  readonly onScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  readonly carouselIndex: number;
}

export const usePortfolioBannersSectionViewModel = ({
  showAssets,
}: PortfolioBannersSectionViewModelParams): PortfolioBannersSectionViewModelResult => {
  const { shouldDisplayQuickActionCtas } = useWalletFeaturesConfig("mobile");
  const hasTopWalletDisplayableCards = useTopWalletHasDisplayableContentCards();
  const shouldShowOnboardingWidget = useOnboardingWidgetVisibility();
  const shouldDisplayRecover = useShouldDisplayRecoverBanner();
  const [carouselIndex, setCarouselIndex] = useState(0);

  const hasAssets = showAssets === true;
  const hasMultipleCards = shouldDisplayRecover && shouldShowOnboardingWidget;
  let sectionMarginTop: PortfolioBannersSectionViewModelResult["sectionMarginTop"] = "s32";

  if (!hasMultipleCards && (!shouldDisplayQuickActionCtas || !hasAssets)) {
    sectionMarginTop = "s16";
  } else if (hasTopWalletDisplayableCards || shouldDisplayRecover) {
    sectionMarginTop = "s12";
  } else if (!hasMultipleCards) {
    sectionMarginTop = "s8";
  }

  const onScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset, layoutMeasurement } = event.nativeEvent;
      const newIndex = Math.round(contentOffset.x / layoutMeasurement.width);
      if (newIndex !== carouselIndex) setCarouselIndex(newIndex);
    },
    [carouselIndex],
  );

  return {
    shouldShowOnboardingWidget,
    sectionMarginTop,
    hasAssets,
    shouldDisplayRecover,
    onScroll,
    carouselIndex,
  };
};
