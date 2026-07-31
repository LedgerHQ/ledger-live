import { useCallback } from "react";
import { Image, Linking } from "react-native";
import { buildLazyOnboardingBannerLink } from "@features/flow-lazy-onboarding-banner";
import { useTranslation } from "~/context/Locale";
import bannerImageSource from "../../assets/lazy-onboarding-banner.png";
import { useLazyOnboardingBannerState } from "../../hooks/useLazyOnboardingBannerState";
import type { LazyOnboardingBannerViewProps } from "./types";

const bannerImageUrl = Image.resolveAssetSource(bannerImageSource).uri;

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
    imageUrl: bannerImageUrl,
    onPress,
    onClose: dismiss,
  };
}
