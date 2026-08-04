export type SanctionedAddressBannerProps = Readonly<{
  title?: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
  testID?: string;
}>;
