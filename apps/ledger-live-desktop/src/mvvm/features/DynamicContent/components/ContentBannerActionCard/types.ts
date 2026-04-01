export type ContentBannerActionCardProps = {
  title: string;
  description?: string;
  onClose: () => void;
  onClick: () => void;
  icon?: string;
  image_background?: string;
};

export const CONTENT_BANNER_ACTION_CARD_CLOSE_LABEL = "Close content banner";
