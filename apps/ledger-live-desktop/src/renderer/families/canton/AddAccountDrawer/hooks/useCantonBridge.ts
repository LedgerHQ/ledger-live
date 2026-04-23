import type {
  CantonCurrencyBridge,
  CantonOnboardProgress,
  CantonOnboardResult,
} from "@ledgerhq/coin-canton/types";
import { OnboardStatus } from "@ledgerhq/coin-canton/types";
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

export interface UseCantonBridgeParams {
  bridge: CantonCurrencyBridge | null;
  currency: CryptoCurrency | null;
  device: Device | null | undefined;
  accountToOnboard: Account | undefined;
  setOnboardingStatus: (status: OnboardStatus) => void;
  setOnboardingResult: (result: OnboardingResult | undefined) => void;
  setOnboardingError: (error: Error | null) => void;
  resetError: () => void;
  onOnboardingComplete?: () => void;
}

export function useCantonBridge({
  bridge,
  currency,
  device,
  accountToOnboard,
  setOnboardingStatus,
  setOnboardingResult,
  setOnboardingError,
  resetError,
  onOnboardingComplete,
}: UseCantonBridgeParams) {
  const { subscribe, unsubscribe } = useObservable();

  const startOnboarding = useCallback(() => {
    if (!bridge || !currency || !device || !accountToOnboard) {
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
            onOnboardingComplete?.();
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
    onOnboardingComplete,
    subscribe,
    setOnboardingStatus,
    setOnboardingResult,
    setOnboardingError,
    resetError,
  ]);

  return {
    startOnboarding,
    unsubscribe,
  };
}
