import { useCallback } from "react";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { useFeature } from "@features/platform-feature-flags";
import {
  useReleaseTourDrawerViewModel,
  type ReleaseTourDrawerViewModel,
} from "LLD/components/ReleaseTour";
import { hasSeenQ3TourSelector } from "~/renderer/reducers/settings";
import { setHasSeenQ3Tour } from "~/renderer/actions/settings";
import { isQ3ReleaseTourEnabled } from "LLD/features/Q2Tour/releaseTourGate";
import { Q3_TOUR_ANALYTICS } from "../../analytics/q3TourCarouselAnalytics";
import { Q3_TOUR_SLIDES } from "../const";

export const useQ3TourDrawerViewModel = (): ReleaseTourDrawerViewModel => {
  const dispatch = useDispatch();
  const hasSeenTour = useSelector(hasSeenQ3TourSelector);
  const isTourEnabled = isQ3ReleaseTourEnabled(useFeature("releaseTour"));

  const markTourAsSeen = useCallback(() => {
    dispatch(setHasSeenQ3Tour(true));
  }, [dispatch]);

  return useReleaseTourDrawerViewModel({
    isTourEnabled,
    hasSeenTour,
    markTourAsSeen,
    slides: Q3_TOUR_SLIDES,
    analytics: Q3_TOUR_ANALYTICS,
  });
};
