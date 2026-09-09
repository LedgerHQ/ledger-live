import {
  createQuarterlyTourAnalytics,
  type QuarterlyTourAnalyticsContext,
} from "LLD/components/QuarterlyTour";
import { Q2_TOUR_SLIDE_COUNT } from "../Drawer/const";
import { PAGE_TRACKING_Q2_TOUR, Q2_TOUR_CONTENT_ID } from "./const";

export type Q2TourAnalyticsContext = QuarterlyTourAnalyticsContext & {
  readonly page: typeof PAGE_TRACKING_Q2_TOUR;
  readonly contentId: typeof Q2_TOUR_CONTENT_ID;
};

const analytics = createQuarterlyTourAnalytics({
  page: PAGE_TRACKING_Q2_TOUR,
  contentId: Q2_TOUR_CONTENT_ID,
  totalSteps: Q2_TOUR_SLIDE_COUNT,
});

export const getQ2TourAnalyticsContext = (
  slideIndex: number,
  stepName: string,
): Q2TourAnalyticsContext => analytics.getContext(slideIndex, stepName) as Q2TourAnalyticsContext;

export const trackQ2TourContinueClick = analytics.trackContinueClick;
export const trackQ2TourCloseClick = analytics.trackCloseClick;
export const trackQ2TourDismissed = analytics.trackDismissed;
export const trackQ2TourCompleted = analytics.trackCompleted;
export const trackQ2TourInitialStep = analytics.trackInitialStep;
export const trackQ2TourStepNavigation = analytics.trackStepNavigation;
