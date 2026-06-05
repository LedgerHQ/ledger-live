import type { CantonCurrencyBridge, CantonOnboardResult } from "@ledgerhq/coin-canton/types";
import { OnboardStatus } from "@ledgerhq/coin-canton/types";
import { useCurrencyBridge } from "@ledgerhq/live-common/bridge/useCurrencyBridge";
import { addAccountsAction } from "@ledgerhq/live-wallet/addAccounts";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import type { Account } from "@ledgerhq/types-live";
import { useNavigation } from "@react-navigation/native";
import type { NavigationProp, ParamListBase } from "@react-navigation/native";
import { useCallback, useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "~/context/hooks";
import { useAppDeviceAction } from "~/hooks/deviceActions";
import { accountsSelector } from "~/reducers/accounts";
import { lastConnectedDeviceSelector } from "~/reducers/settings";
import {
  useCantonBridge,
  useContentSectionViewModel,
  useOnboardingState,
} from "../../hooks/onboarding";
import { restoreNavigationSnapshot, type NavigationSnapshot } from "../../utils/navigationSnapshot";

interface UseCantonReonboardDrawerViewModelParams {
  currency: CryptoCurrency;
  accountToReonboard: Account;
  restoreState?: NavigationSnapshot;
  onClose: () => void;
}

export function useCantonReonboardDrawerViewModel({
  currency,
  accountToReonboard,
  restoreState,
  onClose,
}: UseCantonReonboardDrawerViewModelParams) {
  const navigation = useNavigation<NavigationProp<ParamListBase>>();
  const device = useSelector(lastConnectedDeviceSelector);
  const existingAccounts = useSelector(accountsSelector);
  const dispatch = useDispatch();

  const bridge = useCurrencyBridge<CantonCurrencyBridge>(currency);

  const {
    onboardingStatus,
    onboardResult,
    error,
    setOnboardingStatus,
    setOnboardResult,
    setOnboardingError,
    resetError,
  } = useOnboardingState();

  const finishOnboarding = useCallback(
    (result: CantonOnboardResult) => {
      const updatedAccount = {
        ...accountToReonboard,
        ...result.account,
        id: accountToReonboard.id,
      };

      dispatch(
        addAccountsAction({
          existingAccounts,
          scannedAccounts: [updatedAccount],
          selectedIds: [updatedAccount.id],
          renamings: {},
        }),
      );

      onClose();

      if (restoreState) {
        restoreNavigationSnapshot(navigation, restoreState);
      }
    },
    [accountToReonboard, dispatch, existingAccounts, onClose, restoreState, navigation],
  );

  const { startOnboarding, unsubscribe } = useCantonBridge({
    bridge,
    cryptoCurrency: currency,
    device,
    accountToOnboard: accountToReonboard,
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

  useEffect(() => {
    return () => {
      unsubscribe();
    };
  }, [unsubscribe]);

  const isProcessing =
    onboardingStatus === OnboardStatus.PREPARE ||
    onboardingStatus === OnboardStatus.SIGN ||
    onboardingStatus === OnboardStatus.SUBMIT;

  const showDeviceModal = onboardingStatus === OnboardStatus.SIGN && !!device;
  const isNetworkProcessing = onboardingStatus === OnboardStatus.SUBMIT;

  const deviceAction = useAppDeviceAction();
  const deviceActionRequest = useMemo(() => ({ currency }), [currency]);

  const contentSectionViewModel = useContentSectionViewModel({
    status: {
      onboarding: onboardingStatus,
      hasResult: !!onboardResult,
    },
    isReonboarding: true,
    error,
  });

  return {
    onboardingStatus,
    error,
    isProcessing,
    showDeviceModal,
    isNetworkProcessing,
    device,
    deviceAction,
    deviceActionRequest,
    startOnboarding,
    retryOnboarding,
    accountToReonboard,
    ...contentSectionViewModel,
  };
}
