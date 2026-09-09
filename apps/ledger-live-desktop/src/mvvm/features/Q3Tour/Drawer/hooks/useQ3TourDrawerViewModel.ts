import { useCallback } from "react";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import {
  useQuarterlyTourDrawerViewModel,
  type QuarterlyTourDrawerViewModel,
} from "LLD/components/QuarterlyTour";
import { useWalletFeaturesConfig } from "@features/platform-feature-flags";
import { hasSeenQ3TourSelector } from "~/renderer/reducers/settings";
import { setHasSeenQ3Tour } from "~/renderer/actions/settings";
import { Q3_TOUR_ANALYTICS } from "../../analytics/q3TourCarouselAnalytics";
import { Q3_TOUR_SLIDES } from "../const";

export const useQ3TourDrawerViewModel = (): QuarterlyTourDrawerViewModel => {
  const dispatch = useDispatch();
  const hasSeenTour = useSelector(hasSeenQ3TourSelector);
  const { shouldDisplayQ3Tour } = useWalletFeaturesConfig("desktop");

  const markTourAsSeen = useCallback(() => {
    dispatch(setHasSeenQ3Tour(true));
  }, [dispatch]);

  return useQuarterlyTourDrawerViewModel({
    isTourEnabled: shouldDisplayQ3Tour,
    hasSeenTour,
    markTourAsSeen,
    slides: Q3_TOUR_SLIDES,
    analytics: Q3_TOUR_ANALYTICS,
  });
};
