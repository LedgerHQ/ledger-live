import type { CantonOnboardResult } from "@ledgerhq/coin-canton/types";
import { AuthorizeStatus, OnboardStatus } from "@ledgerhq/coin-canton/types";
import { useCallback, useState } from "react";

export function useOnboardingState() {
  const [onboardingStatus, setOnboardingStatus] = useState<OnboardStatus>(OnboardStatus.INIT);
  const [authorizeStatus, setAuthorizeStatus] = useState<AuthorizeStatus>(AuthorizeStatus.INIT);
  const [onboardResult, setOnboardResult] = useState<CantonOnboardResult | null>(null);
  const [accountsProcessed, setAccountsProcessed] = useState(false);
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

  const markAccountsProcessed = useCallback(() => {
    setAccountsProcessed(true);
  }, []);

  const resetError = useCallback(() => {
    setError(null);
  }, []);

  return {
    onboardingStatus,
    authorizeStatus,
    onboardResult,
    error,
    accountsProcessed,
    setOnboardingStatus,
    setAuthorizeStatus,
    setOnboardResult,
    setOnboardingError,
    setAuthorizationError,
    markAccountsProcessed,
    resetError,
  };
}
