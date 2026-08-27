import { useCallback, useState } from "react";
import { NativeSyntheticEvent, NativeScrollEvent } from "react-native";
import type { LazyOnboardingBannerViewProps } from "@features/flow-lazy-onboarding-banner";
import { useLazyOnboardingBannerViewModel } from "LLM/features/LazyOnboardingBanner";
import { useTopWalletContentCardsPlacement } from "~/dynamicContent/useTopWalletContentCardsPlacement";
import { useOnboardingWidgetVisibility } from "../../hooks/useOnboardingWidgetVisibility";
import useShouldDisplayRecoverBanner from "../RecoverBanner/useShouldDisplayRecoverBanner";

interface PortfolioBannersSectionViewModelParams {
  readonly showAssets?: boolean;
  readonly isLNUpsellBannerShown: boolean;
}

interface PortfolioBannersSectionViewModelResult {
  readonly contentCardsPaddingTop: "s12" | undefined;
  readonly hasAssets: boolean;
  readonly hasTopWalletDisplayableCards: boolean;
  readonly shouldShowOnboardingWidget: boolean;
  readonly lazyOnboardingBanner: LazyOnboardingBannerViewProps;
  readonly shouldDisplayRecover: boolean;
  /** LN upsell exclusive over Recover/onboarding; coexist only with Braze TopWallet cards. */
  readonly canCoexistWithBraze: boolean;
  readonly canShareBrazeCarousel: boolean;
  readonly onScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  readonly carouselIndex: number;
}

export const usePortfolioBannersSectionViewModel = ({
  showAssets,
  isLNUpsellBannerShown,
}: PortfolioBannersSectionViewModelParams): PortfolioBannersSectionViewModelResult => {
  const { hasDisplayableCards: hasTopWalletDisplayableCards, canHostLeadingSlide } =
    useTopWalletContentCardsPlacement();
  const shouldShowOnboardingWidget = useOnboardingWidgetVisibility();
  const lazyOnboardingBanner = useLazyOnboardingBannerViewModel();
  const shouldDisplayRecover = useShouldDisplayRecoverBanner();
  const [carouselIndex, setCarouselIndex] = useState(0);

  const hasAssets = showAssets === true;

  const canCoexistWithBraze =
    isLNUpsellBannerShown &&
    hasAssets &&
    !shouldShowOnboardingWidget &&
    !shouldDisplayRecover &&
    hasTopWalletDisplayableCards;

  const canShareBrazeCarousel = canCoexistWithBraze && canHostLeadingSlide;

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
    hasTopWalletDisplayableCards,
    shouldDisplayRecover,
    canCoexistWithBraze,
    canShareBrazeCarousel,
    onScroll,
    carouselIndex,
  };
};
