import { useEffect, useRef } from "react";
import { useFeature } from "@features/platform-feature-flags";
import { useDispatch, useSelector } from "~/context/hooks";
import { setHasSeenQ3WalletV4Tour } from "~/actions/settings";
import { hasCompletedOnboardingSelector, hasSeenQ3WalletV4TourSelector } from "~/reducers/settings";
import { isQ3ReleaseTourEnabled } from "LLM/utils/releaseTourGate";

export const useSuppressQ3TourForNewUsers = (): void => {
  const dispatch = useDispatch();
  const hasCompletedOnboarding = useSelector(hasCompletedOnboardingSelector);
  const hasSeenTour = useSelector(hasSeenQ3WalletV4TourSelector);
  const isTourEnabled = isQ3ReleaseTourEnabled(useFeature("releaseTour"));

  const wasOnboardedAtOpenRef = useRef(hasCompletedOnboarding);

  useEffect(() => {
    if (isTourEnabled && !wasOnboardedAtOpenRef.current && !hasSeenTour) {
      dispatch(setHasSeenQ3WalletV4Tour(true));
    }
  }, [isTourEnabled, hasSeenTour, dispatch]);
};
