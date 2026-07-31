import React from "react";
import { MediaBanner, MediaBannerDescription, MediaBannerTitle } from "@ledgerhq/lumen-ui-rnative";
import type { LazyOnboardingBannerViewProps } from "./types";

export function LazyOnboardingBannerView({
  isShown,
  title,
  description,
  imageUrl,
  onPress,
  onClose,
}: LazyOnboardingBannerViewProps) {
  if (!isShown) return null;

  return (
    <MediaBanner
      imageUrl={imageUrl}
      onPress={onPress}
      onClose={onClose}
      testID="lazy-onboarding-banner"
    >
      <MediaBannerTitle>{title}</MediaBannerTitle>
      <MediaBannerDescription>{description}</MediaBannerDescription>
    </MediaBanner>
  );
}
