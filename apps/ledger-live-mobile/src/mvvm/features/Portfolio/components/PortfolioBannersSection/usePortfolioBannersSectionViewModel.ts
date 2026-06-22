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
  readonly contentCardsPaddingTop: "s12" | "s24" | undefined;
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

  let contentCardsPaddingTop: PortfolioBannersSectionViewModelResult["contentCardsPaddingTop"];
  if (hasTopWalletDisplayableCards) {
    contentCardsPaddingTop = shouldDisplayQuickActionCtas ? "s12" : "s24";
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
    shouldDisplayRecover,
    onScroll,
    carouselIndex,
  };
};
