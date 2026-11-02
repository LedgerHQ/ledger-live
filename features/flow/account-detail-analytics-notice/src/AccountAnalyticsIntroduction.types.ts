export type AccountAnalyticsIntroductionProps = Readonly<{
  hasConfirmedHistory: boolean;
  hasDismissed: boolean;
  onDismiss: () => void;
  onOpenAnalytics: () => void;
  testID?: string;
}>;
