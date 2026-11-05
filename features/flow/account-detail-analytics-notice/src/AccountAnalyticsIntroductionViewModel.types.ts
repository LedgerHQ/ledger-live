import type { AccountAnalyticsIntroductionProps } from "./AccountAnalyticsIntroduction.types";

export type AccountAnalyticsIntroductionViewModel = Pick<
  AccountAnalyticsIntroductionProps,
  "onDismiss" | "onOpenAnalytics" | "testID"
> &
  Readonly<{
    isVisible: boolean;
    title: string;
    description: string;
    actionLabel: string;
    dismissLabel: string;
  }>;
