export type SanctionedAddressBannerProps = Readonly<{
  description: string;
  actionLabel: string;
  onAction: () => void;
  testID?: string;
}>;
