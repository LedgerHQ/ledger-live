import React, { useCallback } from "react";
import {
  ContentBanner,
  ContentBannerContent,
  ContentBannerDescription,
  ContentBannerTitle,
  InteractiveIcon,
  Spot,
} from "@ledgerhq/lumen-ui-react";
import * as Icons from "@ledgerhq/lumen-ui-react/symbols";
import { Close, Settings } from "@ledgerhq/lumen-ui-react/symbols";

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

  const icon = iconName && iconName in Icons ? Icons[iconName as keyof typeof Icons] : Settings;

  if (image_background && image_background.length > 0) {
    return (
      <div className="relative">
        <button
          type="button"
          onClick={onClick}
          className="w-full cursor-pointer border-none bg-transparent p-0 text-left"
        >
          <ContentBanner className="pr-48">
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
          <Close size={16} />
        </InteractiveIcon>
      </div>
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
        <Close size={16} />
      </InteractiveIcon>
    </div>
  );
};
