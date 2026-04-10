import { OnboardStatus } from "@ledgerhq/coin-canton/types";
import { useCallback, useState } from "react";
import { OnboardingResult } from "../types";

export function useOnboardingState() {
  const [onboardingStatus, setOnboardingStatus] = useState<OnboardStatus>(OnboardStatus.INIT);
  const [onboardingResult, setOnboardingResult] = useState<OnboardingResult | undefined>(undefined);
  const [error, setError] = useState<Error | null>(null);

  const setOnboardingError = useCallback((err: Error | null) => {
    setError(err);
    if (err) {
      setOnboardingStatus(OnboardStatus.ERROR);
    }
  }, []);

  const resetError = useCallback(() => {
    setError(null);
  }, []);

  const resetOnboarding = useCallback(() => {
    setOnboardingStatus(OnboardStatus.INIT);
    setOnboardingResult(undefined);
    setError(null);
  }, []);

  return {
    onboardingStatus,
    onboardingResult,
    error,
    setOnboardingStatus,
    setOnboardingResult,
    setOnboardingError,
    resetError,
    resetOnboarding,
  };
}
