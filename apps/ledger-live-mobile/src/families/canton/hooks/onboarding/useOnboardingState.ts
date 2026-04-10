import type { CantonOnboardResult } from "@ledgerhq/coin-canton/types";
import { OnboardStatus } from "@ledgerhq/coin-canton/types";
import { useCallback, useState } from "react";

export function useOnboardingState() {
  const [onboardingStatus, setOnboardingStatus] = useState<OnboardStatus>(OnboardStatus.INIT);
  const [onboardResult, setOnboardResult] = useState<CantonOnboardResult | null>(null);
  const [accountsProcessed, setAccountsProcessed] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const setOnboardingError = useCallback((err: Error | null) => {
    setError(err);
    if (err) {
      setOnboardingStatus(OnboardStatus.ERROR);
    }
  }, []);

  const markAccountsProcessed = useCallback(() => {
    setAccountsProcessed(true);
  }, []);

  const resetError = useCallback(() => {
    setError(null);
  }, []);

  return {
    onboardingStatus,
    onboardResult,
    error,
    accountsProcessed,
    setOnboardingStatus,
    setOnboardResult,
    setOnboardingError,
    markAccountsProcessed,
    resetError,
  };
}
