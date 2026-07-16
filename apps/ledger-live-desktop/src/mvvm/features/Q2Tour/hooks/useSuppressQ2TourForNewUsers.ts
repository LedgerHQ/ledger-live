import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { useWalletFeaturesConfig } from "@features/platform-feature-flags";
import {
  areSettingsLoaded,
  hasCompletedOnboardingSelector,
  hasSeenQ2TourSelector,
} from "~/renderer/reducers/settings";
import { setHasSeenQ2Tour } from "~/renderer/actions/settings";

/**
 * The Q2 tour is only meant for users who were already onboarded when they got the
 * app version that introduced it. If the app opens and the user is not onboarded, mark
 * the tour as seen so they never see it (they'll onboard on a tour-aware build). See
 * LIVE-34321.
 */
export const useSuppressQ2TourForNewUsers = (): void => {
  const dispatch = useDispatch();
  const settingsLoaded = useSelector(areSettingsLoaded);
  const hasCompletedOnboarding = useSelector(hasCompletedOnboardingSelector);
  const hasSeenQ2Tour = useSelector(hasSeenQ2TourSelector);
  const { shouldDisplayQ2Tour } = useWalletFeaturesConfig("desktop");

  // Snapshot onboarding state at app open (first render where settings are loaded). The
  // tour flag can resolve after that, so we react to it — but decide against the snapshot
  // so a user who finishes onboarding later in this session stays suppressed.
  const wasOnboardedAtOpenRef = useRef<boolean | null>(null);

  useEffect(() => {
    if (!settingsLoaded) return;
    if (wasOnboardedAtOpenRef.current === null) {
      wasOnboardedAtOpenRef.current = hasCompletedOnboarding;
    }
    if (shouldDisplayQ2Tour && !wasOnboardedAtOpenRef.current && !hasSeenQ2Tour) {
      dispatch(setHasSeenQ2Tour(true));
    }
  }, [settingsLoaded, shouldDisplayQ2Tour, hasCompletedOnboarding, hasSeenQ2Tour, dispatch]);
};
