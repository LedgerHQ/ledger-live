import React from "react";
import { MediaBanner, MediaBannerDescription, MediaBannerTitle } from "@ledgerhq/lumen-ui-rnative";

export type LNUpsellMediaBannerProps = Readonly<{
  title: string;
  description: string;
  imageUrl: string;
  onPress: () => void;
}>;

export function LNUpsellMediaBanner({
  title,
  description,
  imageUrl,
  onPress,
}: LNUpsellMediaBannerProps) {
  return (
    <MediaBanner imageUrl={imageUrl} onPress={onPress} testID="lns-upsell-media-banner">
      <MediaBannerTitle>{title}</MediaBannerTitle>
      <MediaBannerDescription>{description}</MediaBannerDescription>
    </MediaBanner>
  );
}
