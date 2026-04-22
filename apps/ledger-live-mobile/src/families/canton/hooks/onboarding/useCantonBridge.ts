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

interface UseCantonBridgeParams {
  bridge: CantonCurrencyBridge;
  cryptoCurrency: CryptoCurrency;
  device: Device | null;
  accountToOnboard: Account | undefined;
  setOnboardingStatus: (status: OnboardStatus) => void;
  setResult: (result: CantonOnboardResult | null) => void;
  setOnboardingError: (error: Error | null) => void;
  resetError: () => void;
  finishOnboarding: (result: CantonOnboardResult) => void;
}

export function useCantonBridge({
  bridge,
  cryptoCurrency,
  device,
  accountToOnboard,
  setOnboardingStatus,
  setResult,
  setOnboardingError,
  resetError,
  finishOnboarding,
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
            setOnboardingStatus(OnboardStatus.SUCCESS);
            finishOnboarding(value);
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
    finishOnboarding,
    subscribe,
    setOnboardingStatus,
    setResult,
    setOnboardingError,
    resetError,
  ]);

  return {
    startOnboarding,
    unsubscribe,
  };
}
