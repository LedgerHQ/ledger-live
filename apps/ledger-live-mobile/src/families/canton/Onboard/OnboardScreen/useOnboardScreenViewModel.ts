import type { CantonCurrencyBridge } from "@ledgerhq/coin-canton/types";
import { OnboardStatus } from "@ledgerhq/coin-canton/types";
import { useCurrencyBridge } from "@ledgerhq/live-common/bridge/useCurrencyBridge";
import { isTokenCurrency } from "@ledgerhq/live-common/currencies/index";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets";
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

  const cryptoCurrency = isTokenCurrency(currency)
    ? getCryptoCurrencyById(currency.parentCurrencyId)
    : currency;
  const bridge = useCurrencyBridge<CantonCurrencyBridge>(cryptoCurrency);

  const {
    onboardingStatus,
    onboardResult,
    error,
    accountsProcessed,
    setOnboardingStatus,
    setOnboardResult,
    setOnboardingError,
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

  const { startOnboarding, unsubscribe } = useCantonBridge({
    bridge,
    cryptoCurrency,
    device,
    accountToOnboard,
    setOnboardingStatus,
    setResult: setOnboardResult,
    setOnboardingError,
    resetError,
    finishOnboarding,
  });

  const retryOnboarding = useCallback(() => {
    resetError();
    startOnboarding();
  }, [resetError, startOnboarding]);

  const handleConfirm = useCallback(() => {
    if (!device || !accountToOnboard) {
      return;
    }
    retryOnboarding();
  }, [device, accountToOnboard, retryOnboarding]);

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

  const isProcessing = isStatusProcessing(onboardingStatus);

  const showDeviceModal = onboardingStatus === OnboardStatus.SIGN && !!device && !!cryptoCurrency;

  const isNetworkProcessing = onboardingStatus === OnboardStatus.SUBMIT;

  const confirmDisabled =
    isProcessing ||
    (onboardingStatus === OnboardStatus.INIT && !isReonboarding && !onboardResult) ||
    onboardingStatus === OnboardStatus.SUCCESS;

  const deviceActionRequest = useMemo(() => ({ currency: cryptoCurrency }), [cryptoCurrency]);

  const contentSectionViewModel = useContentSectionViewModel({
    status: {
      onboarding: onboardingStatus,
      hasResult: !!onboardResult,
    },
    isReonboarding,
    error,
  });

  return {
    // State
    onboardingStatus,
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
]);

export function isStatusProcessing(status: OnboardStatus): boolean {
  return PROCESSING_STATUSES.has(status);
}
