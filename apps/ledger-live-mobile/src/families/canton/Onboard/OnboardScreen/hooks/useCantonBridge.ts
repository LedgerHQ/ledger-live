import type {
  CantonAuthorizeProgress,
  CantonAuthorizeResult,
  CantonCurrencyBridge,
  CantonOnboardProgress,
  CantonOnboardResult,
} from "@ledgerhq/coin-canton/types";
import { AuthorizeStatus, OnboardStatus } from "@ledgerhq/coin-canton/types";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import type { Account } from "@ledgerhq/types-live";
import { useCallback } from "react";
import { useObservable } from "./useObservable";

function isCantonOnboardResult(
  value: CantonOnboardProgress | CantonOnboardResult,
): value is CantonOnboardResult {
  return "partyId" in value && "account" in value;
}

function isCantonOnboardProgress(
  value: CantonOnboardProgress | CantonOnboardResult,
): value is CantonOnboardProgress {
  return "status" in value && !("partyId" in value);
}

function isCantonAuthorizeResult(
  value: CantonAuthorizeProgress | CantonAuthorizeResult,
): value is CantonAuthorizeResult {
  return "isApproved" in value;
}

function isCantonAuthorizeProgress(
  value: CantonAuthorizeProgress | CantonAuthorizeResult,
): value is CantonAuthorizeProgress {
  return "status" in value && !("isApproved" in value);
}

function isApprovedAuthorizeResult(
  value: CantonAuthorizeProgress | CantonAuthorizeResult,
): boolean {
  return isCantonAuthorizeResult(value) && value.isApproved;
}

interface UseCantonBridgeParams {
  bridge: CantonCurrencyBridge;
  cryptoCurrency: CryptoCurrency;
  device: Device | null;
  accountToOnboard: Account | undefined;
  setOnboardingStatus: (status: OnboardStatus) => void;
  setAuthorizeStatus: (status: AuthorizeStatus) => void;
  setResult: (result: CantonOnboardResult | null) => void;
  setOnboardingError: (error: Error | null) => void;
  setAuthorizationError: (error: Error | null) => void;
  resetError: () => void;
  finishOnboarding: (result: CantonOnboardResult) => void;
  skipPreapprovalStep?: boolean;
}

export function useCantonBridge({
  bridge,
  cryptoCurrency,
  device,
  accountToOnboard,
  setOnboardingStatus,
  setAuthorizeStatus,
  setResult,
  setOnboardingError,
  setAuthorizationError,
  resetError,
  finishOnboarding,
  skipPreapprovalStep = false,
}: UseCantonBridgeParams) {
  const { subscribe, unsubscribe } = useObservable();

  const startOnboarding = useCallback(() => {
    if (!device || !accountToOnboard) {
      return;
    }

    resetError();
    setOnboardingStatus(OnboardStatus.PREPARE);

    try {
      const onboardObservable = bridge.onboardAccount(
        cryptoCurrency,
        device.deviceId,
        accountToOnboard,
      );

      subscribe(onboardObservable, {
        onNext: (value: CantonOnboardProgress | CantonOnboardResult) => {
          if (isCantonOnboardResult(value)) {
            resetError();
            setResult(value);
            setOnboardingStatus(OnboardStatus.INIT);
            if (skipPreapprovalStep) {
              setOnboardingStatus(OnboardStatus.SUCCESS);
              finishOnboarding(value);
            }
          } else if (isCantonOnboardProgress(value)) {
            setOnboardingStatus(value.status);
          }
        },
        onError: (error: Error) => {
          setOnboardingError(error);
        },
      });
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      setOnboardingError(err);
    }
  }, [
    device,
    accountToOnboard,
    bridge,
    cryptoCurrency,
    skipPreapprovalStep,
    finishOnboarding,
    subscribe,
    setOnboardingStatus,
    setResult,
    setOnboardingError,
    resetError,
  ]);

  const authorizePreapproval = useCallback(
    (result: CantonOnboardResult) => {
      if (!device) {
        return;
      }

      resetError();
      setAuthorizeStatus(AuthorizeStatus.PREPARE);

      const authorizeObservable = bridge.authorizePreapproval(
        cryptoCurrency,
        device.deviceId,
        result.account,
        result.partyId,
      );

      subscribe(authorizeObservable, {
        onNext: (value: CantonAuthorizeProgress | CantonAuthorizeResult) => {
          if (isApprovedAuthorizeResult(value)) {
            resetError();
            setOnboardingStatus(OnboardStatus.SUCCESS);
            setAuthorizeStatus(AuthorizeStatus.SUCCESS);
            finishOnboarding(result);
          } else if (isCantonAuthorizeProgress(value)) {
            setAuthorizeStatus(value.status);
          }
        },
        onError: (error: Error) => {
          setAuthorizationError(error);
        },
      });
    },
    [
      device,
      bridge,
      cryptoCurrency,
      subscribe,
      setOnboardingStatus,
      setAuthorizeStatus,
      setAuthorizationError,
      resetError,
      finishOnboarding,
    ],
  );

  return {
    startOnboarding,
    authorizePreapproval,
    unsubscribe,
  };
}
