import type { CantonCurrencyBridge } from "@ledgerhq/coin-canton/types";
import { AuthorizeStatus, OnboardStatus } from "@ledgerhq/coin-canton/types";
import { getCurrencyBridge } from "@ledgerhq/live-common/bridge/index";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
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
  const device = useSelector(getCurrentDevice) as Device | null;
  const existingAccounts = useSelector(accountsSelector);
  const skipCantonPreapprovalStep = useFeature("cantonSkipPreapprovalStep");

  const [stepId, setStepId] = useState<StepId>(StepId.ONBOARD);

  const bridge = useMemo(() => {
    if (!currency) return null;
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    return getCurrencyBridge(currency) as CantonCurrencyBridge;
  }, [currency]);

  const {
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
  } = useOnboardingState();

  const creatableAccount = useMemo(
    () => getCreatableAccount(selectedAccounts, isReonboarding, accountToReonboard),
    [selectedAccounts, isReonboarding, accountToReonboard],
  );

  const importableAccounts = useMemo(
    () => getImportableAccounts(selectedAccounts),
    [selectedAccounts],
  );

  const accountName = useMemo(() => {
    if (!currency) return "";
    return resolveCreatableAccountName(
      creatableAccount,
      currency,
      editedNames,
      importableAccounts.length,
    );
  }, [creatableAccount, currency, editedNames, importableAccounts.length]);

  const transitionTo = useCallback((id: StepId) => {
    setStepId(id);
  }, []);

  const onOnboardingComplete = useCallback(() => {
    transitionTo(StepId.FINISH);
  }, [transitionTo]);

  const { startOnboarding, authorizePreapproval, unsubscribe } = useCantonBridge({
    bridge,
    currency,
    device,
    accountToOnboard: creatableAccount,
    setOnboardingStatus,
    setAuthorizeStatus,
    setOnboardingResult,
    setOnboardingError,
    setAuthorizationError,
    resetError,
    onOnboardingComplete,
    skipPreapprovalStep: skipCantonPreapprovalStep?.enabled ?? false,
  });

  const { handleAddAccounts, handleAddMore } = useOnboardingNavigation({
    currency,
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

  const handleRetryPreapproval = useCallback(() => {
    unsubscribe();
    resetAuthorization();
  }, [unsubscribe, resetAuthorization]);

  const handleAuthorizePreapproval = useCallback(() => {
    if (!onboardingResult) return;
    authorizePreapproval(onboardingResult);
  }, [onboardingResult, authorizePreapproval]);

  useEffect(() => {
    return () => {
      unsubscribe();
    };
  }, [unsubscribe]);

  const isProcessing = isStatusProcessing(onboardingStatus) || isStatusProcessing(authorizeStatus);

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
    authorizeStatus,
    onboardingResult,
    error,
    isReonboarding: isReonboarding ?? false,
    skipPreapprovalStep: skipCantonPreapprovalStep?.enabled ?? false,

    transitionTo,
    onAddAccounts: handleAddAccounts,
    onAddMore: handleAddMore,
    onOnboardAccount: handleOnboardAccount,
    onRetryOnboardAccount: handleRetryOnboardAccount,
    onRetryPreapproval: handleRetryPreapproval,
    onAuthorizePreapproval: handleAuthorizePreapproval,
  };
}

const PROCESSING_STATUSES = new Set<OnboardStatus | AuthorizeStatus>([
  OnboardStatus.PREPARE,
  OnboardStatus.SIGN,
  OnboardStatus.SUBMIT,
  AuthorizeStatus.PREPARE,
  AuthorizeStatus.SIGN,
  AuthorizeStatus.SUBMIT,
]);

export function isStatusProcessing(status: OnboardStatus | AuthorizeStatus): boolean {
  return PROCESSING_STATUSES.has(status);
}
