import { createReleaseTourAnalytics } from "LLD/components/ReleaseTour";
import { PAGE_TRACKING_Q3_TOUR, Q3_TOUR_CONTENT_ID } from "./const";

export const createQ3TourAnalytics = (totalSteps: number) =>
  createReleaseTourAnalytics({
    page: PAGE_TRACKING_Q3_TOUR,
    contentId: Q3_TOUR_CONTENT_ID,
    totalSteps,
  });
