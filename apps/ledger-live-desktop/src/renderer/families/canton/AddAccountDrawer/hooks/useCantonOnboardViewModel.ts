import type { CantonCurrencyBridge } from "@ledgerhq/coin-canton/types";
import { OnboardStatus } from "@ledgerhq/coin-canton/types";
import { isCantonAccount } from "@ledgerhq/coin-canton/bridge/serialization";
import { getCurrencyBridge } from "@ledgerhq/live-common/bridge/index";
import { addAccountsAction } from "@ledgerhq/live-wallet/addAccounts";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import type { Account } from "@ledgerhq/types-live";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTheme } from "styled-components";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { useFormatAccount } from "LLD/features/AddAccountDrawer/screens/ScanAccounts/useFormatAccount";
import { accountsSelector } from "~/renderer/reducers/accounts";
import { userThemeSelector } from "~/renderer/reducers/settings";
import { getCurrentDevice } from "~/renderer/reducers/devices";
import { useOnboardingState } from "./useOnboardingState";
import { useCantonBridge } from "./useCantonBridge";
import {
  prepareAccountsForNewOnboarding,
  prepareAccountsForReonboarding,
  getImportableAccounts,
} from "../utils/accountPreparation";

export interface CantonOnboardProps {
  currency: CryptoCurrency;
  selectedAccounts: Account[];
  onComplete: (accounts: Account[]) => void;
  isReonboarding?: boolean;
  accountToReonboard?: Account;
  editedNames?: { [accountId: string]: string };
}

export function useCantonOnboardViewModel({
  currency,
  selectedAccounts,
  onComplete,
  isReonboarding = false,
  accountToReonboard,
  editedNames = {},
}: CantonOnboardProps) {
  const { colors } = useTheme();
  const currentTheme = useSelector(userThemeSelector);
  const device = useSelector(getCurrentDevice);
  const existingAccounts = useSelector(accountsSelector);
  const dispatch = useDispatch();

  const [bridge, setBridge] = useState<CantonCurrencyBridge | null>(null);
  const bridgeCurrencyRef = useRef<typeof currency>(null);
  useEffect(() => {
    if (!currency || bridgeCurrencyRef.current === currency) return;
    bridgeCurrencyRef.current = currency;
    // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
    getCurrencyBridge(currency).then(b => setBridge(b as CantonCurrencyBridge));
  }, [currency]);

  const {
    onboardingStatus,
    onboardingResult,
    setOnboardingStatus,
    setOnboardingResult,
    setOnboardingError,
    resetError,
    resetOnboarding,
  } = useOnboardingState();

  const accountToOnboard = useMemo(
    () =>
      isReonboarding && accountToReonboard
        ? accountToReonboard
        : selectedAccounts.find(
            account => isCantonAccount(account) && !account.cantonResources.isOnboarded,
          ),
    [selectedAccounts, isReonboarding, accountToReonboard],
  );

  const importableAccounts = useMemo(
    () => getImportableAccounts(selectedAccounts),
    [selectedAccounts],
  );

  const formatAccount = useFormatAccount(currency);

  const handleOnboardingComplete = useCallback(() => {
    // No-op: account addition is triggered by the footer button
  }, []);

  const { startOnboarding, unsubscribe } = useCantonBridge({
    bridge,
    currency,
    device,
    accountToOnboard,
    setOnboardingStatus,
    setOnboardingResult,
    setOnboardingError,
    resetError,
    onOnboardingComplete: handleOnboardingComplete,
  });

  useEffect(() => {
    return () => {
      unsubscribe();
    };
  }, [unsubscribe]);

  const handleRetry = useCallback(() => {
    unsubscribe();
    resetOnboarding();
  }, [unsubscribe, resetOnboarding]);

  const handleAddAccounts = useCallback(() => {
    if (!onboardingResult) return;

    const { accounts, renamings } =
      isReonboarding && accountToReonboard
        ? prepareAccountsForReonboarding(
            accountToReonboard,
            onboardingResult.completedAccount,
            editedNames,
          )
        : prepareAccountsForNewOnboarding(
            importableAccounts,
            onboardingResult.completedAccount,
            editedNames,
          );

    dispatch(
      addAccountsAction({
        scannedAccounts: accounts,
        existingAccounts,
        selectedIds: accounts.map(a => a.id),
        renamings,
      }),
    );

    onComplete(accounts);
  }, [
    onboardingResult,
    importableAccounts,
    existingAccounts,
    dispatch,
    onComplete,
    isReonboarding,
    accountToReonboard,
    editedNames,
  ]);

  const isProcessing =
    onboardingStatus === OnboardStatus.PREPARE || onboardingStatus === OnboardStatus.SUBMIT;

  return {
    onboardingStatus,
    device,
    currentTheme,
    isReonboarding,
    isProcessing,
    importableAccounts,
    accountToOnboard,
    currency,
    formatAccount,
    colors,
    startOnboarding,
    handleRetry,
    handleAddAccounts,
  };
}

export type CantonOnboardViewProps = ReturnType<typeof useCantonOnboardViewModel>;
