import { createReleaseTourAnalytics } from "LLD/components/ReleaseTour";
import { Q3_TOUR_SLIDE_COUNT } from "../Drawer/const";
import { PAGE_TRACKING_Q3_TOUR, Q3_TOUR_CONTENT_ID } from "./const";

export const Q3_TOUR_ANALYTICS = createReleaseTourAnalytics({
  page: PAGE_TRACKING_Q3_TOUR,
  contentId: Q3_TOUR_CONTENT_ID,
  totalSteps: Q3_TOUR_SLIDE_COUNT,
});
