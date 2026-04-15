import React from "react";
import {
  ContentBanner,
  ContentBannerContent,
  ContentBannerDescription,
  ContentBannerTitle,
  InteractiveIcon,
  Spot,
  MediaBanner,
  MediaBannerTitle,
  MediaBannerDescription,
} from "@ledgerhq/lumen-ui-react";
import * as Icons from "@ledgerhq/lumen-ui-react/symbols";

import type { ContentBannerActionCardProps } from "./types";
import { useContentBannerActionCardViewModel } from "./useContentBannerActionCardViewModel";

export type { ContentBannerActionCardProps } from "./types";
export { CONTENT_BANNER_ACTION_CARD_CLOSE_LABEL } from "./types";

export const ContentBannerActionCard = (props: ContentBannerActionCardProps) => {
  const { title, description, onClick } = props;
  const {
    closeAriaLabel,
    handleClose,
    handleMediaBannerClick,
    hasImageBackground,
    icon,
    imageUrl,
  } = useContentBannerActionCardViewModel(props);

  if (hasImageBackground) {
    return (
      <MediaBanner
        imageUrl={imageUrl}
        onClose={handleClose}
        onClick={handleMediaBannerClick}
        closeAriaLabel={closeAriaLabel}
      >
        {title && <MediaBannerTitle>{title}</MediaBannerTitle>}
        {description && <MediaBannerDescription>{description}</MediaBannerDescription>}
      </MediaBanner>
    );
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={onClick}
        className="w-full cursor-pointer border-none bg-transparent p-0 text-left"
      >
        <ContentBanner className="pr-48">
          <Spot appearance="icon" icon={icon} size={48} />
          <ContentBannerContent>
            {title && <ContentBannerTitle>{title}</ContentBannerTitle>}
            {description && <ContentBannerDescription>{description}</ContentBannerDescription>}
          </ContentBannerContent>
        </ContentBanner>
      </button>
      <InteractiveIcon
        type="button"
        iconType="stroked"
        icon={Icons.Close}
        size={16}
        aria-label={closeAriaLabel}
        onClick={handleClose}
        className="absolute top-8 right-8"
      />
    </div>
  );
};
