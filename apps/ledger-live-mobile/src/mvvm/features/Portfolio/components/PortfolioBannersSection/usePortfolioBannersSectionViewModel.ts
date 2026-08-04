import { useCallback, useState } from "react";
import { NativeSyntheticEvent, NativeScrollEvent } from "react-native";
import type { LazyOnboardingBannerViewProps } from "@features/flow-lazy-onboarding-banner";
import { useLazyOnboardingBannerViewModel } from "LLM/features/LazyOnboardingBanner";
import { useTopWalletHasDisplayableContentCards } from "~/dynamicContent/useTopWalletHasDisplayableContentCards";
import { useOnboardingWidgetVisibility } from "../../hooks/useOnboardingWidgetVisibility";
import useShouldDisplayRecoverBanner from "../RecoverBanner/useShouldDisplayRecoverBanner";

interface PortfolioBannersSectionViewModelParams {
  readonly showAssets?: boolean;
}

interface PortfolioBannersSectionViewModelResult {
  readonly contentCardsPaddingTop: "s12" | undefined;
  readonly hasAssets: boolean;
  readonly shouldShowOnboardingWidget: boolean;
  readonly lazyOnboardingBanner: LazyOnboardingBannerViewProps;
  readonly shouldDisplayRecover: boolean;
  readonly onScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  readonly carouselIndex: number;
}

export const usePortfolioBannersSectionViewModel = ({
  showAssets,
}: PortfolioBannersSectionViewModelParams): PortfolioBannersSectionViewModelResult => {
  const hasTopWalletDisplayableCards = useTopWalletHasDisplayableContentCards();
  const shouldShowOnboardingWidget = useOnboardingWidgetVisibility();
  const lazyOnboardingBanner = useLazyOnboardingBannerViewModel();
  const shouldDisplayRecover = useShouldDisplayRecoverBanner();
  const [carouselIndex, setCarouselIndex] = useState(0);

  const hasAssets = showAssets === true;

  let contentCardsPaddingTop: PortfolioBannersSectionViewModelResult["contentCardsPaddingTop"];
  if (hasTopWalletDisplayableCards) {
    contentCardsPaddingTop = "s12";
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
    lazyOnboardingBanner,
    contentCardsPaddingTop,
    hasAssets,
    shouldDisplayRecover,
    onScroll,
    carouselIndex,
  };
};
