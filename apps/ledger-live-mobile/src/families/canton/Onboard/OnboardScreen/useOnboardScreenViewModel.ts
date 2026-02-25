import type { CantonCurrencyBridge } from "@ledgerhq/coin-canton/types";
import { AuthorizeStatus, OnboardStatus } from "@ledgerhq/coin-canton/types";
import { getCurrencyBridge } from "@ledgerhq/live-common/bridge/index";
import { isTokenCurrency } from "@ledgerhq/live-common/currencies/index";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { addAccountsAction } from "@ledgerhq/live-wallet/addAccounts";
import { useCallback, useEffect, useLayoutEffect, useMemo } from "react";
import { useDispatch, useSelector } from "~/context/hooks";
import { useAppDeviceAction } from "~/hooks/deviceActions";
import { accountsSelector } from "~/reducers/accounts";
import { lastConnectedDeviceSelector } from "~/reducers/settings";
import {
  useCantonBridge,
  useContentSectionViewModel,
  useOnboardingNavigation,
  useOnboardingState,
} from "./hooks";
import type { OnboardScreenViewModelParams } from "./types";

export function useOnboardScreenViewModel({ navigation, route }: OnboardScreenViewModelParams) {
  const {
    accountsToAdd: routeAccountsToAdd,
    currency,
    isReonboarding = false,
    accountToReonboard,
  } = route.params ?? {};

  const accountsToAdd = useMemo(() => routeAccountsToAdd ?? [], [routeAccountsToAdd]);

  const device = useSelector(lastConnectedDeviceSelector);
  const existingAccounts = useSelector(accountsSelector);
  const dispatch = useDispatch();
  const skipCantonPreapprovalStep = useFeature("cantonSkipPreapprovalStep");

  const cryptoCurrency = isTokenCurrency(currency) ? currency.parentCurrency : currency;
  const bridge = useMemo(() => {
    const currencyBridge = getCurrencyBridge(cryptoCurrency);
    if (!currencyBridge) {
      throw new Error(`Currency bridge not found for ${cryptoCurrency.id}`);
    }
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    return currencyBridge as CantonCurrencyBridge;
  }, [cryptoCurrency]);

  const {
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
  } = useOnboardingState();

  const accountsToDisplay =
    isReonboarding && accountToReonboard ? [accountToReonboard] : accountsToAdd;

  const accountToOnboard =
    isReonboarding && accountToReonboard
      ? accountToReonboard
      : accountsToAdd.find(account => !account.used);

  const selectedIds = accountsToDisplay.map(account => account.id);

  const { navigateToSuccess, finishOnboarding } = useOnboardingNavigation({
    navigation,
    route,
    accountsToAdd,
    cryptoCurrency,
    dispatch,
    existingAccounts,
  });

  const { startOnboarding, authorizePreapproval, unsubscribe } = useCantonBridge({
    bridge,
    cryptoCurrency,
    device,
    accountToOnboard,
    setOnboardingStatus,
    setAuthorizeStatus,
    setResult: setOnboardResult,
    setOnboardingError,
    setAuthorizationError,
    resetError,
    finishOnboarding,
    skipPreapprovalStep: skipCantonPreapprovalStep?.enabled ?? false,
  });

  const retryOnboarding = useCallback(() => {
    resetError();
    startOnboarding();
  }, [resetError, startOnboarding]);

  const handleConfirm = useCallback(() => {
    if (!onboardResult) {
      if (!device || !accountToOnboard) {
        return;
      }
      retryOnboarding();
      return;
    }

    if (!device) {
      return;
    }

    authorizePreapproval(onboardResult);
  }, [onboardResult, device, accountToOnboard, retryOnboarding, authorizePreapproval]);

  const deviceAction = useAppDeviceAction();

  useEffect(() => {
    if (!device || !accountToOnboard) {
      return;
    }

    // Don't auto-start onboarding in these cases:
    // - Reonboarding mode (user must manually trigger)
    // - There's an error (e.g., user rejected on device)
    // Only start automatically if status is INIT and there's no error
    if (isReonboarding || error || onboardingStatus === OnboardStatus.ERROR) {
      return;
    }

    if (onboardingStatus === OnboardStatus.INIT) {
      startOnboarding();
    }
  }, [device, accountToOnboard, startOnboarding, isReonboarding, error, onboardingStatus]);

  // Cleanup subscription only on unmount
  useEffect(() => {
    return () => {
      unsubscribe();
    };
  }, [unsubscribe]);

  useLayoutEffect(() => {
    if (isReonboarding || accountsProcessed) return;

    const unusedAccounts = accountsToAdd.filter(account => !account.used);
    if (unusedAccounts.length === 0) {
      markAccountsProcessed();
      dispatch(
        addAccountsAction({
          existingAccounts,
          scannedAccounts: accountsToAdd,
          selectedIds: accountsToAdd.map(account => account.id),
          renamings: {},
        }),
      );
      navigateToSuccess();
    }
  }, [
    accountsToAdd,
    dispatch,
    existingAccounts,
    accountsProcessed,
    isReonboarding,
    navigateToSuccess,
    markAccountsProcessed,
  ]);

  const isProcessing = isStatusProcessing(onboardingStatus) || isStatusProcessing(authorizeStatus);

  const showDeviceModal =
    (onboardingStatus === OnboardStatus.SIGN || authorizeStatus === AuthorizeStatus.SIGN) &&
    !!device &&
    !!cryptoCurrency;

  const isNetworkProcessing =
    onboardingStatus === OnboardStatus.SUBMIT || authorizeStatus === AuthorizeStatus.SUBMIT;

  const confirmDisabled =
    isProcessing ||
    (onboardingStatus === OnboardStatus.INIT && !isReonboarding && !onboardResult) ||
    onboardingStatus === OnboardStatus.SUCCESS;

  const deviceActionRequest = useMemo(() => ({ currency: cryptoCurrency }), [cryptoCurrency]);

  const contentSectionViewModel = useContentSectionViewModel({
    status: {
      onboarding: onboardingStatus,
      authorize: authorizeStatus,
      hasResult: !!onboardResult,
    },
    isReonboarding,
    error,
  });

  return {
    // State
    onboardingStatus,
    authorizeStatus,
    onboardResult,
    error,
    accountsToDisplay,
    selectedIds,
    isReonboarding,

    // Computed
    isProcessing,
    showDeviceModal,
    isNetworkProcessing,
    confirmDisabled,

    // Actions
    handleConfirm,
    retryOnboarding,

    // Child ViewModels
    ...contentSectionViewModel,

    // Device
    device,
    cryptoCurrency,
    deviceActionRequest,
    action: deviceAction,
  };
}

const PROCESSING_STATUSES = new Set([
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
