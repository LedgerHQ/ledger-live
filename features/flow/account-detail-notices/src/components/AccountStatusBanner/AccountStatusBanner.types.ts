export type AccountStatusBannerAction = "learnMore" | "openPerps";

export type AccountStatusBannerProps = Readonly<{
  title: string;
  description?: string;
  action?: AccountStatusBannerAction;
  onAction?: () => void;
  testID?: string;
}>;
