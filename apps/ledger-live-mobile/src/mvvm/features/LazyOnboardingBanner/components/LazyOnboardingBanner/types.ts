export type LazyOnboardingBannerViewProps = Readonly<{
  isShown: boolean;
  title: string;
  description: string;
  imageUrl: string;
  onPress: () => void;
  onClose: () => void;
}>;
