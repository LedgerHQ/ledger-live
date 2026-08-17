export type SmallSquareCardProps = Readonly<{
  title?: string;
  subDescription?: string;
  tag?: string;
  media?: string;
  mediaType?: "video" | "image" | "gif";
  filledMedia?: boolean;
  isDismissable?: boolean;
  onClick?: () => void;
  onDismiss?: () => void;
}>;
