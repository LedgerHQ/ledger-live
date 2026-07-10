import { useEffect } from "react";
import { useDispatch } from "~/context/hooks";
import { setHasSeenQ2WalletV4Tour } from "~/actions/settings";

/**
 * Call on the first screen of the onboarding flow (Welcome).
 * Marks the Q2 Wallet V4 tour as "seen" so the tour drawer does not open after onboarding.
 */
export function useMarkQ2WalletV4TourSeenAtOnboardingStart(): void {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(setHasSeenQ2WalletV4Tour(true));
  }, [dispatch]);
}
