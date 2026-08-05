import { useCallback, useState } from "react";
import { NativeSyntheticEvent, NativeScrollEvent } from "react-native";
import { useTopWalletHasDisplayableContentCards } from "~/dynamicContent/useTopWalletHasDisplayableContentCards";
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
  readonly shouldDisplayRecover: boolean;
  /** LN upsell exclusive over Recover/onboarding; coexist only with Braze TopWallet cards. */
  readonly canCoexistWithBraze: boolean;
  readonly onScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
  readonly carouselIndex: number;
}

export const usePortfolioBannersSectionViewModel = ({
  showAssets,
  isLNUpsellBannerShown,
}: PortfolioBannersSectionViewModelParams): PortfolioBannersSectionViewModelResult => {
  const hasTopWalletDisplayableCards = useTopWalletHasDisplayableContentCards();
  const shouldShowOnboardingWidget = useOnboardingWidgetVisibility();
  const shouldDisplayRecover = useShouldDisplayRecoverBanner();
  const [carouselIndex, setCarouselIndex] = useState(0);

  const hasAssets = showAssets === true;

  const canCoexistWithBraze =
    isLNUpsellBannerShown &&
    hasAssets &&
    !shouldShowOnboardingWidget &&
    !shouldDisplayRecover &&
    hasTopWalletDisplayableCards;

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
    contentCardsPaddingTop,
    hasAssets,
    hasTopWalletDisplayableCards,
    shouldDisplayRecover,
    canCoexistWithBraze,
    onScroll,
    carouselIndex,
  };
};
