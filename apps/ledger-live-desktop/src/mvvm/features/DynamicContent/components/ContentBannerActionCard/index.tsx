import React, { useCallback } from "react";
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

export type ContentBannerActionCardProps = {
  title: string;
  description?: string;
  onClose: () => void;
  onClick: () => void;
  icon?: string;
  image_background?: string;
};

export const ContentBannerActionCard = ({
  title,
  description,
  onClose,
  onClick,
  icon: iconName,
  image_background,
}: ContentBannerActionCardProps) => {
  const handleClose = useCallback(
    (e?: React.MouseEvent) => {
      e?.preventDefault();
      e?.stopPropagation();
      onClose();
    },
    [onClose],
  );

  const handleMediaBannerClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if ((e.target as HTMLElement).closest("button")) return;
      onClick();
    },
    [onClick],
  );

  const icon = iconName && iconName in Icons ? Icons[iconName as keyof typeof Icons] : Icons.Settings;

  if (image_background && image_background.length > 0) {
    return (
      <MediaBanner imageUrl={image_background} onClose={handleClose} onClick={handleMediaBannerClick}>
          <MediaBannerTitle>
            {title}
          </MediaBannerTitle>
          <MediaBannerDescription>
            {description}
          </MediaBannerDescription>
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
        aria-label="Close content banner"
        onClick={handleClose}
        className="absolute top-8 right-8"
      >
        <Icons.Close size={16} />
      </InteractiveIcon>
    </div>
  );
};
