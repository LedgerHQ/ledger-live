export type AccountAnalyticsIntroductionProps = Readonly<{
  isEnabled: boolean;
  hasConfirmedHistory: boolean;
  hasDismissed: boolean;
  onDismiss: () => void;
  onOpenAnalytics: () => void;
  testID?: string;
}>;
