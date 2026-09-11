import { useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { useFeature } from "@features/platform-feature-flags";
import {
  useReleaseTourDrawerViewModel,
  type ReleaseTourConfig,
  type ReleaseTourDrawerViewModel,
} from "LLD/components/ReleaseTour";
import { hasSeenQ3TourSelector } from "~/renderer/reducers/settings";
import { setHasSeenQ3Tour } from "~/renderer/actions/settings";
import { isQ3ReleaseTourEnabled } from "LLD/features/Q2Tour/releaseTourGate";
import { createQ3TourAnalytics } from "../../analytics/q3TourCarouselAnalytics";
import { getQ3TourConfig } from "../const";

export type Q3TourDrawerViewModel = ReleaseTourDrawerViewModel & {
  readonly tour: ReleaseTourConfig;
};

export const useQ3TourDrawerViewModel = (): Q3TourDrawerViewModel => {
  const dispatch = useDispatch();
  const hasSeenTour = useSelector(hasSeenQ3TourSelector);
  const releaseTour = useFeature("releaseTour");
  const isTourEnabled = isQ3ReleaseTourEnabled(releaseTour);
  const tour = getQ3TourConfig(releaseTour?.params?.variant);
  const analytics = useMemo(() => createQ3TourAnalytics(tour.slides.length), [tour.slides.length]);

  const markTourAsSeen = useCallback(() => {
    dispatch(setHasSeenQ3Tour(true));
  }, [dispatch]);

  const drawer = useReleaseTourDrawerViewModel({
    isTourEnabled,
    hasSeenTour,
    markTourAsSeen,
    slides: tour.slides,
    analytics,
  });

  return { ...drawer, tour };
};
