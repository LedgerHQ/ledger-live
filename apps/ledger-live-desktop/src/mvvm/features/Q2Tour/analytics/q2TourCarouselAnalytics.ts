import { track, trackPage } from "~/renderer/analytics/segment";
import { Q2_TOUR_SLIDE_COUNT } from "../Drawer/const";
import { PAGE_TRACKING_Q2_TOUR, Q2_TOUR_CONTENT_ID } from "./const";

export type Q2TourAnalyticsContext = {
  readonly page: typeof PAGE_TRACKING_Q2_TOUR;
  readonly contentId: typeof Q2_TOUR_CONTENT_ID;
  readonly step: number;
  readonly stepName: string;
  readonly totalSteps: number;
};

export const getQ2TourAnalyticsContext = (
  slideIndex: number,
  stepName: string,
): Q2TourAnalyticsContext => ({
  page: PAGE_TRACKING_Q2_TOUR,
  contentId: Q2_TOUR_CONTENT_ID,
  step: slideIndex + 1,
  stepName,
  totalSteps: Q2_TOUR_SLIDE_COUNT,
});

const getQ2TourPageProperties = (context: Q2TourAnalyticsContext) => ({
  name: PAGE_TRACKING_Q2_TOUR,
  contentId: context.contentId,
  step: context.step,
  stepName: context.stepName,
  totalSteps: context.totalSteps,
});

const getQ2TourInteractionProperties = (context: Q2TourAnalyticsContext) => ({
  page: context.page,
  contentId: context.contentId,
  step: context.step,
  stepName: context.stepName,
  totalSteps: context.totalSteps,
});

const trackQ2TourStepPage = (context: Q2TourAnalyticsContext): void => {
  trackPage(PAGE_TRACKING_Q2_TOUR, undefined, getQ2TourPageProperties(context), true, false);
};

export const trackQ2TourContinueClick = (context: Q2TourAnalyticsContext): void => {
  track("button_clicked", {
    button: "continue",
    ...getQ2TourInteractionProperties(context),
    ctaPosition: "secondary",
  });
};

export const trackQ2TourCloseClick = (context: Q2TourAnalyticsContext): void => {
  track("button_clicked", {
    button: "close",
    ...getQ2TourInteractionProperties(context),
  });
};

export const trackQ2TourDismissed = (context: Q2TourAnalyticsContext): void => {
  track("drawer_dismissed", {
    drawer: PAGE_TRACKING_Q2_TOUR,
    page: context.page,
    contentId: context.contentId,
    step: context.step,
    stepName: context.stepName,
    totalSteps: context.totalSteps,
  });
};

export const trackQ2TourCompleted = (context: Q2TourAnalyticsContext): void => {
  track("tour_completed", getQ2TourInteractionProperties(context));
};

export const trackQ2TourInitialStep = (context: Q2TourAnalyticsContext): void => {
  trackQ2TourStepPage(context);
};

export const trackQ2TourStepNavigation = (context: Q2TourAnalyticsContext): void => {
  trackQ2TourStepPage(context);
};
