import { useCallback } from "react";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { useFeature } from "@features/platform-feature-flags";
import {
  useQuarterlyTourDrawerViewModel,
  type QuarterlyTourAnalytics,
  type QuarterlyTourDrawerViewModel,
} from "LLD/components/QuarterlyTour";
import {
  hasCompletedOnboardingSelector,
  hasSeenQ2TourSelector,
} from "~/renderer/reducers/settings";
import { setHasSeenQ2Tour } from "~/renderer/actions/settings";
import { isQ2ReleaseTourEnabled } from "../../releaseTourGate";
import {
  getQ2TourAnalyticsContext,
  trackQ2TourCloseClick,
  trackQ2TourContinueClick,
  trackQ2TourDismissed,
  trackQ2TourCompleted,
  trackQ2TourInitialStep,
  trackQ2TourStepNavigation,
} from "../../analytics/q2TourCarouselAnalytics";
import { Q2_TOUR_SLIDES } from "../const";

export interface UseQ2TourDrawerViewModelOptions {
  /** When true and Q2 tour is enabled and not yet seen, the dialog will auto-open (e.g. on Portfolio page). */
  isOnPortfolioPage?: boolean;
}

export type Q2TourDrawerViewModel = QuarterlyTourDrawerViewModel;

const Q2_TOUR_ANALYTICS: QuarterlyTourAnalytics = {
  getContext: getQ2TourAnalyticsContext,
  trackCloseClick: trackQ2TourCloseClick,
  trackContinueClick: trackQ2TourContinueClick,
  trackDismissed: trackQ2TourDismissed,
  trackCompleted: trackQ2TourCompleted,
  trackInitialStep: trackQ2TourInitialStep,
  trackStepNavigation: trackQ2TourStepNavigation,
};

export const useQ2TourDrawerViewModel = (
  options: UseQ2TourDrawerViewModelOptions = {},
): Q2TourDrawerViewModel => {
  const { isOnPortfolioPage = false } = options;
  const dispatch = useDispatch();
  const hasSeenTour = useSelector(hasSeenQ2TourSelector);
  const hasCompletedOnboarding = useSelector(hasCompletedOnboardingSelector);
  const isTourEnabled = isQ2ReleaseTourEnabled(useFeature("releaseTour"));

  const markTourAsSeen = useCallback(() => {
    dispatch(setHasSeenQ2Tour(true));
  }, [dispatch]);

  return useQuarterlyTourDrawerViewModel({
    isTourEnabled,
    hasSeenTour,
    markTourAsSeen,
    shouldAutoOpen: isOnPortfolioPage && hasCompletedOnboarding,
    slides: Q2_TOUR_SLIDES,
    analytics: Q2_TOUR_ANALYTICS,
  });
};
