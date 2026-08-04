import { useCallback } from "react";
import { Linking } from "react-native";
import {
  buildLazyOnboardingBannerLink,
  type LazyOnboardingBannerViewProps,
} from "@features/flow-lazy-onboarding-banner";
import { useTranslation } from "~/context/Locale";
import { useLazyOnboardingBannerState } from "../../hooks/useLazyOnboardingBannerState";

export function useLazyOnboardingBannerViewModel(): LazyOnboardingBannerViewProps {
  const { t } = useTranslation();
  const { isShown, link, dismiss } = useLazyOnboardingBannerState();
  const shopLink = buildLazyOnboardingBannerLink(link, "mobile");

  const onPress = useCallback(() => {
    void Linking.openURL(shopLink);
  }, [shopLink]);

  return {
    isShown,
    title: t("lazyOnboardingBanner.title"),
    description: t("lazyOnboardingBanner.description"),
    onPress,
    onClose: dismiss,
  };
}
