export const withOptionalVariant = <T extends object>(properties: T, variant?: string) =>
  variant === undefined ? properties : { ...properties, variant };

export type WalletV4TourAnalyticsContext = {
  readonly page: string;
  readonly contentId: string;
  readonly step: number;
  readonly stepName: string;
  readonly totalSteps: number;
  readonly variant?: string;
};

export type WalletV4TourAnalytics = {
  readonly getContext: (slideIndex: number, stepName: string) => WalletV4TourAnalyticsContext;
  readonly trackCloseClick: (context: WalletV4TourAnalyticsContext) => void;
  readonly trackContinueClick: (context: WalletV4TourAnalyticsContext) => void;
  readonly trackDismissed: (context: WalletV4TourAnalyticsContext) => void;
  readonly trackCompleted: (context: WalletV4TourAnalyticsContext) => void;
  readonly trackInitialStep: (context: WalletV4TourAnalyticsContext) => void;
  readonly trackStepNavigation: (context: WalletV4TourAnalyticsContext) => void;
};
