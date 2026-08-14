import { useCallback } from "react";
import { Linking } from "react-native";
import {
  buildLazyOnboardingBannerLink,
  resolveLazyOnboardingBannerTapAction,
  type LazyOnboardingBannerViewProps,
} from "@features/flow-lazy-onboarding-banner";
import { useTranslation } from "~/context/Locale";
import { lazyOnboardingTourController } from "../LazyOnboardingTour/lazyOnboardingTourController";
import { useLazyOnboardingBannerState } from "../../hooks/useLazyOnboardingBannerState";
import { trackLazyOnboardingBannerDismissed, trackLazyOnboardingBannerPressed } from "./analytics";

export function useLazyOnboardingBannerViewModel(): LazyOnboardingBannerViewProps {
  const { t } = useTranslation();
  const { isShown, link, mode, dismiss } = useLazyOnboardingBannerState();
  const shopLink = buildLazyOnboardingBannerLink(link, "mobile");

  const onPress = useCallback(() => {
    trackLazyOnboardingBannerPressed();
    const action = resolveLazyOnboardingBannerTapAction(mode);

    if (action === "open_feature_intro_tour") {
      lazyOnboardingTourController.open();
      return;
    }

    void Linking.openURL(shopLink);
  }, [mode, shopLink]);

  const onClose = useCallback(() => {
    trackLazyOnboardingBannerDismissed();
    dismiss();
  }, [dismiss]);

  return {
    isShown,
    title: t("lazyOnboardingBanner.title"),
    description: t("lazyOnboardingBanner.description"),
    onPress,
    onClose,
  };
}
