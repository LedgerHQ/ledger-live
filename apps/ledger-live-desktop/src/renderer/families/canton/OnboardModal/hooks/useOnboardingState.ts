import { AuthorizeStatus, OnboardStatus } from "@ledgerhq/coin-canton/types";
import { useCallback, useState } from "react";
import { OnboardingResult } from "../types";

export function useOnboardingState() {
  const [onboardingStatus, setOnboardingStatus] = useState<OnboardStatus>(OnboardStatus.INIT);
  const [authorizeStatus, setAuthorizeStatus] = useState<AuthorizeStatus>(AuthorizeStatus.INIT);
  const [onboardingResult, setOnboardingResult] = useState<OnboardingResult | undefined>(undefined);
  const [error, setError] = useState<Error | null>(null);

  const setOnboardingError = useCallback((err: Error | null) => {
    setError(err);
    if (err) {
      setOnboardingStatus(OnboardStatus.ERROR);
    }
  }, []);

  const setAuthorizationError = useCallback((err: Error | null) => {
    setError(err);
    if (err) {
      setAuthorizeStatus(AuthorizeStatus.ERROR);
    }
  }, []);

  const resetError = useCallback(() => {
    setError(null);
  }, []);

  const resetOnboarding = useCallback(() => {
    setOnboardingStatus(OnboardStatus.INIT);
    setAuthorizeStatus(AuthorizeStatus.INIT);
    setOnboardingResult(undefined);
    setError(null);
  }, []);

  const resetAuthorization = useCallback(() => {
    setAuthorizeStatus(AuthorizeStatus.INIT);
    setError(null);
  }, []);

  return {
    onboardingStatus,
    authorizeStatus,
    onboardingResult,
    error,
    setOnboardingStatus,
    setAuthorizeStatus,
    setOnboardingResult,
    setOnboardingError,
    setAuthorizationError,
    resetError,
    resetOnboarding,
    resetAuthorization,
  };
}
