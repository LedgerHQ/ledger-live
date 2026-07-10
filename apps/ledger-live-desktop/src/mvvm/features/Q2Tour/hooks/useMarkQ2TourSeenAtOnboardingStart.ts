import { useEffect } from "react";
import { useDispatch } from "LLD/hooks/redux";
import { setHasSeenQ2Tour } from "~/renderer/actions/settings";

/**
 * Call on the first screen of the onboarding flow (Welcome).
 * Marks the Q2 tour as "seen" so the tour dialog does not open after onboarding.
 */
export function useMarkQ2TourSeenAtOnboardingStart(): void {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(setHasSeenQ2Tour(true));
  }, [dispatch]);
}
