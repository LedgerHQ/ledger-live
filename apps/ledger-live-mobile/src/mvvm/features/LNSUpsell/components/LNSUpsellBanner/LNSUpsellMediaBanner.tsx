import React from "react";
import {
  MediaBanner,
  MediaBannerDescription,
  MediaBannerTitle,
} from "@ledgerhq/lumen-ui-rnative";

export type LNSUpsellMediaBannerProps = Readonly<{
  title: string;
  description: string;
  imageUrl: string;
  onPress: () => void;
}>;

export function LNSUpsellMediaBanner({
  title,
  description,
  imageUrl,
  onPress,
}: LNSUpsellMediaBannerProps) {
  return (
    <MediaBanner imageUrl={imageUrl} onPress={onPress} testID="lns-upsell-media-banner">
      <MediaBannerTitle>{title}</MediaBannerTitle>
      <MediaBannerDescription>{description}</MediaBannerDescription>
    </MediaBanner>
  );
}
