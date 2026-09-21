import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { useFeature } from "@features/platform-feature-flags";
import {
  areSettingsLoaded,
  hasCompletedOnboardingSelector,
  hasSeenQ3TourSelector,
} from "~/renderer/reducers/settings";
import { setHasSeenQ3Tour } from "~/renderer/actions/settings";
import { isQ3ReleaseTourEnabled } from "LLD/features/Q2Tour/releaseTourGate";

export const useSuppressQ3TourForNewUsers = (): void => {
  const dispatch = useDispatch();
  const settingsLoaded = useSelector(areSettingsLoaded);
  const hasCompletedOnboarding = useSelector(hasCompletedOnboardingSelector);
  const hasSeenQ3Tour = useSelector(hasSeenQ3TourSelector);
  const isTourEnabled = isQ3ReleaseTourEnabled(useFeature("releaseTour"));

  const wasOnboardedAtOpenRef = useRef<boolean | null>(null);

  useEffect(() => {
    if (!settingsLoaded) return;
    if (wasOnboardedAtOpenRef.current === null) {
      wasOnboardedAtOpenRef.current = hasCompletedOnboarding;
    }
    if (isTourEnabled && !wasOnboardedAtOpenRef.current && !hasSeenQ3Tour) {
      dispatch(setHasSeenQ3Tour(true));
    }
  }, [settingsLoaded, isTourEnabled, hasCompletedOnboarding, hasSeenQ3Tour, dispatch]);
};
