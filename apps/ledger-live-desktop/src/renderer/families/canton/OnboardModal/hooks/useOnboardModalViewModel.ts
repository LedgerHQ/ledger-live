import type { CantonCurrencyBridge } from "@ledgerhq/coin-canton/types";
import { OnboardStatus } from "@ledgerhq/coin-canton/types";
import { useCurrencyBridge } from "@ledgerhq/live-common/bridge/useCurrencyBridge";
import { useSelector } from "LLD/hooks/redux";
import { useCallback, useEffect, useMemo, useState } from "react";
import { accountsSelector } from "~/renderer/reducers/accounts";
import { getCurrentDevice } from "~/renderer/reducers/devices";
import type { UserProps } from "../types";
import { StepId } from "../types";
import {
  getCreatableAccount,
  getImportableAccounts,
  resolveCreatableAccountName,
} from "../utils/accountPreparation";
import { useCantonBridge } from "./useCantonBridge";
import { useOnboardingNavigation } from "./useOnboardingNavigation";
import { useOnboardingState } from "./useOnboardingState";

export function useOnboardModalViewModel({
  currency,
  editedNames,
  selectedAccounts,
  isReonboarding,
  accountToReonboard,
  navigationSnapshot,
}: UserProps) {
  const device = useSelector(getCurrentDevice);
  const existingAccounts = useSelector(accountsSelector);

  const [stepId, setStepId] = useState<StepId>(StepId.ONBOARD);

  const bridge = useCurrencyBridge<CantonCurrencyBridge>(currency);

  const {
    onboardingStatus,
    onboardingResult,
    error,
    setOnboardingStatus,
    setOnboardingResult,
    setOnboardingError,
    resetError,
    resetOnboarding,
  } = useOnboardingState();

  const creatableAccount = useMemo(
    () => getCreatableAccount(selectedAccounts, isReonboarding, accountToReonboard),
    [selectedAccounts, isReonboarding, accountToReonboard],
  );

  const importableAccounts = useMemo(
    () => getImportableAccounts(selectedAccounts),
    [selectedAccounts],
  );

  const accountName = useMemo(
    () => resolveCreatableAccountName(creatableAccount, currency, editedNames, importableAccounts.length),
    [creatableAccount, currency, editedNames, importableAccounts.length],
  );

  const transitionTo = useCallback((id: StepId) => {
    setStepId(id);
  }, []);

  const onOnboardingComplete = useCallback(() => {
    transitionTo(StepId.FINISH);
  }, [transitionTo]);

  const { startOnboarding, unsubscribe } = useCantonBridge({
    bridge,
    currency,
    device,
    accountToOnboard: creatableAccount,
    setOnboardingStatus,
    setOnboardingResult,
    setOnboardingError,
    resetError,
    onOnboardingComplete,
  });

  const { handleAddAccounts } = useOnboardingNavigation({
    selectedAccounts,
    existingAccounts,
    editedNames,
    isReonboarding,
    accountToReonboard,
    navigationSnapshot,
    onboardingResult,
  });

  const handleOnboardAccount = useCallback(() => {
    startOnboarding();
  }, [startOnboarding]);

  const handleRetryOnboardAccount = useCallback(() => {
    unsubscribe();
    resetOnboarding();
  }, [unsubscribe, resetOnboarding]);

  useEffect(() => {
    return () => {
      unsubscribe();
    };
  }, [unsubscribe]);

  const isProcessing = isStatusProcessing(onboardingStatus);

  return {
    device,
    currency,
    stepId,
    accountName,
    editedNames,
    creatableAccount,
    importableAccounts,
    isProcessing,
    onboardingStatus,
    onboardingResult,
    error,
    isReonboarding: isReonboarding ?? false,

    transitionTo,
    onAddAccounts: handleAddAccounts,
    onOnboardAccount: handleOnboardAccount,
    onRetryOnboardAccount: handleRetryOnboardAccount,
  };
}

const PROCESSING_STATUSES = new Set<OnboardStatus>([
  OnboardStatus.PREPARE,
  OnboardStatus.SIGN,
  OnboardStatus.SUBMIT,
]);

export function isStatusProcessing(status: OnboardStatus): boolean {
  return PROCESSING_STATUSES.has(status);
}
