import React from "react";
import { Image } from "react-native";
import { MediaBanner, MediaBannerDescription, MediaBannerTitle } from "@ledgerhq/lumen-ui-rnative";
import bannerImageSource from "../../assets/lazy-onboarding-banner.webp";
import type { LazyOnboardingBannerViewProps } from "./types";

const bannerImageUrl = Image.resolveAssetSource(bannerImageSource).uri;

export function LazyOnboardingBannerView({
  isShown,
  title,
  description,
  onPress,
  onClose,
  testID = "lazy-onboarding-banner",
}: LazyOnboardingBannerViewProps) {
  if (!isShown) return null;

  return (
    <MediaBanner imageUrl={bannerImageUrl} onPress={onPress} onClose={onClose} testID={testID}>
      <MediaBannerTitle>{title}</MediaBannerTitle>
      <MediaBannerDescription>{description}</MediaBannerDescription>
    </MediaBanner>
  );
}
