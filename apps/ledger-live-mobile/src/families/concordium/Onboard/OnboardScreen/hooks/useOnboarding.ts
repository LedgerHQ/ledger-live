import { useCallback, useEffect, useRef, useState } from "react";
import { getCurrencyBridge } from "@ledgerhq/live-common/bridge/index";
import type { ConcordiumCurrencyBridge } from "@ledgerhq/coin-concordium";
import { AccountOnboardStatus } from "@ledgerhq/coin-concordium/types";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import type { Account } from "@ledgerhq/types-live";
import { log } from "@ledgerhq/logs";
import { Subscription } from "rxjs";

const CONFIRMATION_CODE_LENGTH = 4;

export enum CreateStatus {
  PREPARING = "PREPARING",
  SUBMITTING = "SUBMITTING",
  SUCCESS = "SUCCESS",
  ERROR = "ERROR",
}

export function getConfirmationCode(sessionTopic: string): string {
  return sessionTopic.substring(0, CONFIRMATION_CODE_LENGTH).toUpperCase();
}

export function isSessionExpiredError(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return (
    message.includes("No active WalletConnect session") ||
    message.includes("Pairing approval is expired")
  );
}

export function useOnboarding(
  currency: CryptoCurrency,
  deviceId: string,
  creatableAccount: Account,
  sessionTopic: string,
  onSessionExpired: () => void,
) {
  const [createStatus, setCreateStatus] = useState<CreateStatus>(CreateStatus.PREPARING);
  const confirmationCode = getConfirmationCode(sessionTopic);
  const subscriptionRef = useRef<Subscription | null>(null);
  const completedRef = useRef(false);

  const unsubscribe = useCallback(() => {
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe();
      subscriptionRef.current = null;
    }
  }, []);

  const startOnboarding = useCallback(() => {
    unsubscribe();
    completedRef.current = false;
    setCreateStatus(CreateStatus.PREPARING);

    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    const bridge = getCurrencyBridge(currency) as ConcordiumCurrencyBridge;
    subscriptionRef.current = bridge
      .onboardAccount(currency.id, deviceId, creatableAccount)
      .subscribe({
        next: data => {
          if (completedRef.current) return;
          log("concordium-onboarding", "onboardAccount progress", {
            status: "status" in data ? data.status : undefined,
            hasAccount: "account" in data,
          });
          if ("status" in data) {
            if (
              data.status === AccountOnboardStatus.SIGN ||
              data.status === AccountOnboardStatus.SUBMIT
            ) {
              setCreateStatus(CreateStatus.SUBMITTING);
            }
          }
          if ("account" in data) {
            completedRef.current = true;
            unsubscribe();
            setCreateStatus(CreateStatus.SUCCESS);
          }
        },
        error: error => {
          if (completedRef.current) return;
          completedRef.current = true;
          log("concordium-onboarding", "onboardAccount error", {
            message: error instanceof Error ? error.message : String(error),
          });
          unsubscribe();
          if (isSessionExpiredError(error)) {
            onSessionExpired();
          } else {
            setCreateStatus(CreateStatus.ERROR);
          }
        },
      });
  }, [currency, deviceId, creatableAccount, unsubscribe, onSessionExpired]);

  useEffect(() => {
    startOnboarding();
    return unsubscribe;
  }, [startOnboarding, unsubscribe]);

  return { createStatus, confirmationCode, startOnboarding };
}
