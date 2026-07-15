import { useEffect, useRef } from "react";
import { useFeature } from "@features/platform-feature-flags";
import { useDispatch, useSelector } from "~/context/hooks";
import { setHasSeenQ2WalletV4Tour } from "~/actions/settings";
import { hasCompletedOnboardingSelector, hasSeenQ2WalletV4TourSelector } from "~/reducers/settings";

/**
 * The Q2 tour is only meant for users who were already onboarded when they got the
 * app version that introduced it. If the app opens and the user is not onboarded, mark
 * the tour as seen so they never see it (they'll onboard on a tour-aware build).
 * Called once from RootNavigator, which mounts after the store is hydrated. See LIVE-34321.
 */
export const useSuppressQ2TourForNewUsers = (): void => {
  const dispatch = useDispatch();
  const hasCompletedOnboarding = useSelector(hasCompletedOnboardingSelector);
  const hasSeenTour = useSelector(hasSeenQ2WalletV4TourSelector);
  const lwmWallet40 = useFeature("lwmWallet40");
  const isTourEnabled = (lwmWallet40?.enabled && lwmWallet40?.params?.q2Tour) ?? false;

  // Snapshot onboarding state at app open (first render; the store is already hydrated).
  // The tour flag can toggle on after mount, so we react to it — but decide against the
  // snapshot so a user who finishes onboarding later in this session stays suppressed.
  const wasOnboardedAtOpenRef = useRef(hasCompletedOnboarding);

  useEffect(() => {
    if (isTourEnabled && !wasOnboardedAtOpenRef.current && !hasSeenTour) {
      dispatch(setHasSeenQ2WalletV4Tour(true));
    }
  }, [isTourEnabled, hasSeenTour, dispatch]);
};
