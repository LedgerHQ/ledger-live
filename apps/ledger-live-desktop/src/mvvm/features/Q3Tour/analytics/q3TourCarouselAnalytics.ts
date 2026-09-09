import { createQuarterlyTourAnalytics } from "LLD/components/QuarterlyTour";
import { Q3_TOUR_SLIDE_COUNT } from "../Drawer/const";
import { PAGE_TRACKING_Q3_TOUR, Q3_TOUR_CONTENT_ID } from "./const";

export const Q3_TOUR_ANALYTICS = createQuarterlyTourAnalytics({
  page: PAGE_TRACKING_Q3_TOUR,
  contentId: Q3_TOUR_CONTENT_ID,
  totalSteps: Q3_TOUR_SLIDE_COUNT,
});
