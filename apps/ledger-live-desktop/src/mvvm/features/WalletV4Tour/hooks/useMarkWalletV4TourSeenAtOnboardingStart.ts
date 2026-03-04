import { useEffect } from "react";
import { useDispatch } from "LLD/hooks/redux";
import { setHasSeenWalletV4Tour } from "~/renderer/actions/settings";

/**
 * Call on the first screen of the onboarding flow (Welcome).
 * Marks the Wallet V4 tour as "seen" so the tour dialog does not open after onboarding.
 */
export function useMarkWalletV4TourSeenAtOnboardingStart(): void {
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(setHasSeenWalletV4Tour(true));
  }, [dispatch]);
}
