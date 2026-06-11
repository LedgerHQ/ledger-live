import React, { type ReactNode } from "react";
import { MediaBanner, MediaBannerDescription, MediaBannerTitle } from "@ledgerhq/lumen-ui-react";

export type LNSUpsellMediaBannerProps = Readonly<{
  title: string;
  description: ReactNode;
  imageUrl: string;
  onClick: () => void;
}>;

export function LNSUpsellMediaBanner({
  title,
  description,
  imageUrl,
  onClick,
}: LNSUpsellMediaBannerProps) {
  return (
    <MediaBanner
      imageUrl={imageUrl}
      onClick={onClick}
      data-testid="lns-upsell-media-banner"
      className="w-full min-w-0"
    >
      <MediaBannerTitle>{title}</MediaBannerTitle>
      <MediaBannerDescription>{description}</MediaBannerDescription>
    </MediaBanner>
  );
}
