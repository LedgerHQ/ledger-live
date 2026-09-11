export type ReleaseTourImageSource = {
  readonly light: string;
  readonly dark: string;
};

export type ReleaseTourSlide = {
  readonly id: string;
  readonly titleKey: string;
  readonly descriptionKey: string;
  readonly ctaKey: string;
  readonly imageSrc: ReleaseTourImageSource;
};

export const defineReleaseTourSlide = (
  id: string,
  titleKey: string,
  descriptionKey: string,
  ctaKey: string,
  imageSrc: ReleaseTourImageSource,
): ReleaseTourSlide => ({ id, titleKey, descriptionKey, ctaKey, imageSrc });

export type ReleaseTourConfig = {
  readonly id: string;
  readonly slides: readonly ReleaseTourSlide[];
};

export type ReleaseTourAnalyticsContext = {
  readonly page: string;
  readonly contentId: string;
  readonly step: number;
  readonly stepName: string;
  readonly totalSteps: number;
};

export type ReleaseTourAnalytics = {
  readonly getContext: (slideIndex: number, stepName: string) => ReleaseTourAnalyticsContext;
  readonly trackCloseClick: (context: ReleaseTourAnalyticsContext) => void;
  readonly trackContinueClick: (context: ReleaseTourAnalyticsContext) => void;
  readonly trackDismissed: (context: ReleaseTourAnalyticsContext) => void;
  readonly trackCompleted: (context: ReleaseTourAnalyticsContext) => void;
  readonly trackInitialStep: (context: ReleaseTourAnalyticsContext) => void;
  readonly trackStepNavigation: (context: ReleaseTourAnalyticsContext) => void;
};

export interface ReleaseTourDrawerViewModel {
  readonly isDialogOpen: boolean;
  readonly hasSeenTour: boolean;
  readonly handleOpenDialog: () => void;
  readonly handleCloseDialog: () => void;
  readonly closeDrawer: () => void;
  readonly dismissDrawer: () => void;
  readonly completeDrawer: () => void;
  readonly onSlideChange: (index: number) => void;
  readonly onContinueClick: (slideIndex: number, isLastSlide: boolean) => void;
}
