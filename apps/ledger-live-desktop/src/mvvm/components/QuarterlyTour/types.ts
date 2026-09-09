export type QuarterlyTourImageSource = {
  readonly light: string;
  readonly dark: string;
};

export type QuarterlyTourSlide = {
  readonly id: string;
  readonly titleKey: string;
  readonly descriptionKey: string;
  readonly ctaKey: string;
  readonly imageSrc: QuarterlyTourImageSource;
};

export const defineQuarterlyTourSlide = (
  id: string,
  titleKey: string,
  descriptionKey: string,
  ctaKey: string,
  imageSrc: QuarterlyTourImageSource,
): QuarterlyTourSlide => ({ id, titleKey, descriptionKey, ctaKey, imageSrc });

export type QuarterlyTourConfig = {
  readonly id: string;
  readonly slides: readonly QuarterlyTourSlide[];
};

export type QuarterlyTourAnalyticsContext = {
  readonly page: string;
  readonly contentId: string;
  readonly step: number;
  readonly stepName: string;
  readonly totalSteps: number;
};

export type QuarterlyTourAnalytics = {
  readonly getContext: (slideIndex: number, stepName: string) => QuarterlyTourAnalyticsContext;
  readonly trackCloseClick: (context: QuarterlyTourAnalyticsContext) => void;
  readonly trackContinueClick: (context: QuarterlyTourAnalyticsContext) => void;
  readonly trackDismissed: (context: QuarterlyTourAnalyticsContext) => void;
  readonly trackCompleted: (context: QuarterlyTourAnalyticsContext) => void;
  readonly trackInitialStep: (context: QuarterlyTourAnalyticsContext) => void;
  readonly trackStepNavigation: (context: QuarterlyTourAnalyticsContext) => void;
};

export interface QuarterlyTourDrawerViewModel {
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
