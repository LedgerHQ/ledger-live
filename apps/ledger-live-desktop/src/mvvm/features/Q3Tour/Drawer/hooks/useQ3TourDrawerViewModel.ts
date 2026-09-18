import { useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { useFeature } from "@features/platform-feature-flags";
import {
  useReleaseTourDrawerViewModel,
  type ReleaseTourConfig,
  type ReleaseTourDrawerViewModel,
} from "LLD/components/ReleaseTour";
import {
  hasCompletedOnboardingSelector,
  hasSeenQ3TourSelector,
} from "~/renderer/reducers/settings";
import { setHasSeenQ3Tour } from "~/renderer/actions/settings";
import { isQ3ReleaseTourEnabled } from "LLD/features/Q2Tour/releaseTourGate";
import { getQ3TourStepName } from "../../analytics/const";
import { createQ3TourAnalytics } from "../../analytics/q3TourCarouselAnalytics";
import { getQ3TourConfig, resolveQ3TourVariant } from "../const";

export interface UseQ3TourDrawerViewModelOptions {
  isOnPortfolioPage?: boolean;
}

export type Q3TourDrawerViewModel = ReleaseTourDrawerViewModel & {
  readonly tour: ReleaseTourConfig;
};

export const useQ3TourDrawerViewModel = (
  options: UseQ3TourDrawerViewModelOptions = {},
): Q3TourDrawerViewModel => {
  const { isOnPortfolioPage = false } = options;
  const dispatch = useDispatch();
  const hasSeenTour = useSelector(hasSeenQ3TourSelector);
  const hasCompletedOnboarding = useSelector(hasCompletedOnboardingSelector);
  const releaseTour = useFeature("releaseTour");
  const isTourEnabled = isQ3ReleaseTourEnabled(releaseTour);
  const variant = resolveQ3TourVariant(releaseTour?.params?.variant);
  const tour = getQ3TourConfig(variant);
  const analytics = useMemo(
    () => createQ3TourAnalytics(tour.slides.length, variant),
    [tour.slides.length, variant],
  );

  const markTourAsSeen = useCallback(() => {
    dispatch(setHasSeenQ3Tour(true));
  }, [dispatch]);

  const drawer = useReleaseTourDrawerViewModel({
    isTourEnabled,
    hasSeenTour,
    markTourAsSeen,
    shouldAutoOpen: isOnPortfolioPage && hasCompletedOnboarding,
    slides: tour.slides,
    analytics,
    getStepName: getQ3TourStepName,
  });

  return { ...drawer, tour };
};
