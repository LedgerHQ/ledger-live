export type AccountAnalyticsIntroductionProps = Readonly<{
  isEnabled: boolean;
  isEligible: boolean;
  hasConfirmedHistory: boolean;
  hasDismissed: boolean;
  onDismiss: () => void;
  onOpenAnalytics: () => void;
  testID?: string;
}>;
