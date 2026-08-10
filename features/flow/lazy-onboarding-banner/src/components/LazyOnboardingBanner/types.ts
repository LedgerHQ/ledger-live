export type LazyOnboardingBannerViewProps = Readonly<{
  isShown: boolean;
  title: string;
  description: string;
  onPress: () => void;
  onClose: () => void;
}>;
