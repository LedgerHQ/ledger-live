import React, { useCallback } from "react";
import {
  ContentBanner,
  ContentBannerContent,
  ContentBannerDescription,
  ContentBannerTitle,
  InteractiveIcon,
  Spot,
} from "@ledgerhq/lumen-ui-react";
import { Close, Settings } from "@ledgerhq/lumen-ui-react/symbols";

export type ContentBannerActionCardProps = {
  title: string;
  description?: string;
  onClose: () => void;
  onClick: () => void;
};

export const ContentBannerActionCard = ({
  title,
  description,
  onClose,
  onClick,
}: ContentBannerActionCardProps) => {
  const handleClose = useCallback(
    (e?: React.MouseEvent) => {
      e?.preventDefault();
      e?.stopPropagation();
      onClose();
    },
    [onClose],
  );

  return (
    <div className="relative">
      <button
        type="button"
        onClick={onClick}
        className="w-full cursor-pointer border-none bg-transparent p-0 text-left"
      >
        <ContentBanner className="pr-48">
          <Spot appearance="icon" icon={Settings} size={48} />
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
