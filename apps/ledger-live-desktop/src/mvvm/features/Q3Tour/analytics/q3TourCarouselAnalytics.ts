import { createReleaseTourAnalytics } from "LLD/components/ReleaseTour";
import type { Q3TourVariant } from "../Drawer/const";
import { PAGE_TRACKING_Q3_TOUR, Q3_TOUR_CONTENT_ID } from "./const";

export const createQ3TourAnalytics = (totalSteps: number, variant: Q3TourVariant) =>
  createReleaseTourAnalytics({
    page: PAGE_TRACKING_Q3_TOUR,
    contentId: Q3_TOUR_CONTENT_ID,
    totalSteps,
    variant,
  });
