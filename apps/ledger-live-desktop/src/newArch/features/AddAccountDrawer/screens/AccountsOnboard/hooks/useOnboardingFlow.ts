import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { Account } from "@ledgerhq/types-live";
import { useCallback, useEffect, useRef, useState } from "react";
import { Subscription } from "rxjs";
import logger from "~/renderer/logger";
import {
  AccountOnboardStatus,
  OnboardingBridge,
  OnboardingConfig,
  OnboardingResult,
  OnboardProgress,
  OnboardResult,
  StepId,
} from "../types";

export function useOnboardingFlow({
  currency,
  device,
  creatableAccount,
  onboardingBridge,
  onboardingConfig,
}: {
  currency: CryptoCurrency;
  device: Device;
  creatableAccount: Account;
  onboardingBridge: OnboardingBridge;
  onboardingConfig: OnboardingConfig;
}) {
  const [stepId, setStepId] = useState<StepId>(onboardingConfig.stepFlow[0] || StepId.ONBOARD);
  const [error, setError] = useState<Error | null>(null);
  const [onboardingStatus, setOnboardingStatus] = useState<AccountOnboardStatus>(
    AccountOnboardStatus.INIT,
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [onboardingResult, setOnboardingResult] = useState<OnboardingResult | undefined>(undefined);

  const onboardingSubscriptionRef = useRef<Subscription | undefined>();

  // Cleanup subscriptions on unmount
  useEffect(() => {
    return () => {
      if (onboardingSubscriptionRef.current) {
        onboardingSubscriptionRef.current.unsubscribe();
      }
    };
  }, []);

  const handleUnsubscribe = useCallback(() => {
    if (onboardingSubscriptionRef.current) {
      onboardingSubscriptionRef.current.unsubscribe();
      onboardingSubscriptionRef.current = undefined;
    }
  }, []);

  const handleRetryOnboardAccount = useCallback(() => {
    handleUnsubscribe();
    setStepId(onboardingConfig.stepFlow[0] || StepId.ONBOARD);
    setError(null);
    setOnboardingStatus(AccountOnboardStatus.INIT);
    setIsProcessing(false);
    setOnboardingResult(undefined);
  }, [handleUnsubscribe, onboardingConfig]);

  const transitionTo = useCallback(
    (newStepId: StepId) => {
      if (!onboardingConfig.stepFlow.includes(newStepId)) {
        logger.error(
          `[transitionTo] Invalid step transition: ${stepId} -> ${newStepId}. Step not in flow.`,
        );
        return;
      }
      setStepId(newStepId);
    },
    [onboardingConfig.stepFlow, stepId],
  );

  const handleOnboardAccount = useCallback(() => {
    setIsProcessing(true);
    setOnboardingStatus(AccountOnboardStatus.PREPARE);
    setError(null);

    // Cleanup any existing subscription
    if (onboardingSubscriptionRef.current) {
      onboardingSubscriptionRef.current.unsubscribe();
    }

    onboardingSubscriptionRef.current = onboardingBridge
      .onboardAccount(currency, device.deviceId, creatableAccount)
      .subscribe({
        next: (data: OnboardProgress | OnboardResult) => {
          if ("status" in data) {
            setOnboardingStatus(data.status);
          }

          if ("account" in data) {
            setOnboardingResult({
              completedAccount: data.account,
              metadata: data.metadata,
            });
            setOnboardingStatus(AccountOnboardStatus.SUCCESS);
            setIsProcessing(false);
          }
        },
        complete: () => {
          // Subscription completed successfully
        },
        error: (err: Error) => {
          logger.error("[handleOnboardAccount] failed", err);
          setOnboardingStatus(AccountOnboardStatus.ERROR);
          setIsProcessing(false);
          setError(err);
        },
      });
  }, [creatableAccount, device, currency, onboardingBridge]);

  return {
    stepId,
    error,
    onboardingStatus,
    isProcessing,
    onboardingResult,
    handleOnboardAccount,
    handleRetryOnboardAccount,
    transitionTo,
  };
}
