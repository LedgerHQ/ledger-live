import { useCallback, useEffect, useMemo } from "react";
import { Linking } from "react-native";
import {
  buildLazyOnboardingBannerLink,
  resolveLazyOnboardingBannerTapAction,
  type LazyOnboardingBannerViewProps,
} from "@features/flow-lazy-onboarding-banner";
import { useTranslation } from "~/context/Locale";
import { useSelector } from "~/context/hooks";
import { personalizedRecommendationsEnabledSelector } from "~/reducers/settings";
import { buildLazyOnboardingSharedAnalyticsProps } from "../../analyticsConstants";
import { lazyOnboardingTourController } from "../LazyOnboardingTour/lazyOnboardingTourController";
import { useLazyOnboardingBannerState } from "../../hooks/useLazyOnboardingBannerState";
import {
  trackLazyOnboardingBannerDismissed,
  trackLazyOnboardingBannerPressed,
  trackLazyOnboardingBannerShown,
} from "./analytics";

export function useLazyOnboardingBannerViewModel(): LazyOnboardingBannerViewProps {
  const { t } = useTranslation();
  const { isShown, link, mode, dismiss } = useLazyOnboardingBannerState();
  const personalizedRecommendationsEnabled = useSelector(
    personalizedRecommendationsEnabledSelector,
  );
  const shopLink = buildLazyOnboardingBannerLink(link, "mobile");

  const sharedAnalyticsProps = useMemo(
    () =>
      isShown
        ? buildLazyOnboardingSharedAnalyticsProps(mode, personalizedRecommendationsEnabled)
        : null,
    [isShown, mode, personalizedRecommendationsEnabled],
  );

  useEffect(() => {
    if (!sharedAnalyticsProps) {
      return;
    }

    trackLazyOnboardingBannerShown(sharedAnalyticsProps);
  }, [sharedAnalyticsProps]);

  const onPress = useCallback(() => {
    trackLazyOnboardingBannerPressed(mode, personalizedRecommendationsEnabled);
    const action = resolveLazyOnboardingBannerTapAction(mode);

    if (action === "open_feature_intro_tour") {
      lazyOnboardingTourController.open();
      return;
    }

    void Linking.openURL(shopLink);
  }, [mode, personalizedRecommendationsEnabled, shopLink]);

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
