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
import type { OnboardingResult } from "../types";
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

export interface UseCantonBridgeParams {
  bridge: CantonCurrencyBridge;
  currency: CryptoCurrency;
  device: Device | null | undefined;
  accountToOnboard: Account | undefined;
  setOnboardingStatus: (status: OnboardStatus) => void;
  setAuthorizeStatus: (status: AuthorizeStatus) => void;
  setOnboardingResult: (result: OnboardingResult | undefined) => void;
  setOnboardingError: (error: Error | null) => void;
  setAuthorizationError: (error: Error | null) => void;
  resetError: () => void;
  onOnboardingComplete?: () => void;
  skipPreapprovalStep?: boolean;
}

export function useCantonBridge({
  bridge,
  currency,
  device,
  accountToOnboard,
  setOnboardingStatus,
  setAuthorizeStatus,
  setOnboardingResult,
  setOnboardingError,
  setAuthorizationError,
  resetError,
  onOnboardingComplete,
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
      const onboardObservable = bridge.onboardAccount(currency, device.deviceId, accountToOnboard);

      subscribe(onboardObservable, {
        onNext: (value: CantonOnboardProgress | CantonOnboardResult) => {
          if (isCantonOnboardResult(value)) {
            resetError();
            setOnboardingResult({
              partyId: value.partyId,
              completedAccount: value.account,
            });
            setOnboardingStatus(OnboardStatus.SUCCESS);
            if (skipPreapprovalStep) {
              onOnboardingComplete?.();
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
    currency,
    skipPreapprovalStep,
    onOnboardingComplete,
    subscribe,
    setOnboardingStatus,
    setOnboardingResult,
    setOnboardingError,
    resetError,
  ]);

  const authorizePreapproval = useCallback(
    (result: OnboardingResult) => {
      if (!device) {
        return;
      }

      resetError();
      setAuthorizeStatus(AuthorizeStatus.PREPARE);

      try {
        const authorizeObservable = bridge.authorizePreapproval(
          currency,
          device.deviceId,
          result.completedAccount,
          result.partyId,
        );

        subscribe(authorizeObservable, {
          onNext: (value: CantonAuthorizeProgress | CantonAuthorizeResult) => {
            if (isApprovedAuthorizeResult(value)) {
              resetError();
              setOnboardingStatus(OnboardStatus.SUCCESS);
              setAuthorizeStatus(AuthorizeStatus.SUCCESS);
              onOnboardingComplete?.();
            } else if (isCantonAuthorizeProgress(value)) {
              setAuthorizeStatus(value.status);
            }
          },
          onError: (error: Error) => {
            setAuthorizationError(error);
          },
        });
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        setAuthorizationError(err);
      }
    },
    [
      device,
      bridge,
      currency,
      subscribe,
      setOnboardingStatus,
      setAuthorizeStatus,
      setAuthorizationError,
      resetError,
      onOnboardingComplete,
    ],
  );

  return {
    startOnboarding,
    authorizePreapproval,
    unsubscribe,
  };
}
