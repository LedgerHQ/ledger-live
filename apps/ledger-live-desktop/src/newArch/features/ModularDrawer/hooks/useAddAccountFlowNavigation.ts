import { useCallback, useMemo, useState } from "react";
import { Account } from "@ledgerhq/types-live";
import { MODULAR_DRAWER_ADD_ACCOUNT_STEP, WarningReason } from "../types";
import { useAddAccountNavigation } from "./useModularDrawerNavigation";

interface UseAddAccountFlowNavigationProps {
  selectedAccounts: Account[];
  onAccountSelected?: (account: Account) => void;
}

export const useAddAccountFlowNavigation = ({
  selectedAccounts,
  onAccountSelected,
}: UseAddAccountFlowNavigationProps) => {
  const { currentStep, navigationDirection, goToStep } = useAddAccountNavigation();

  const [warningReason, setWarningReason] = useState<WarningReason>();
  const [emptyAccount, setEmptyAccount] = useState<Account>();
  const [accountToFund, setAccountToFund] = useState<Account>();

  const navigateToWarningScreen = useCallback(
    (reason?: WarningReason, account?: Account) => {
      if (!warningReason && !emptyAccount) {
        setWarningReason(reason);
        setEmptyAccount(account);
      }
      goToStep(MODULAR_DRAWER_ADD_ACCOUNT_STEP.ACCOUNTS_WARNING);
    },
    [goToStep, warningReason, emptyAccount],
  );

  const navigateToFundAccount = useCallback(
    (account: Account) => {
      setAccountToFund(account);
      if (onAccountSelected) {
        onAccountSelected(account);
      } else {
        goToStep(MODULAR_DRAWER_ADD_ACCOUNT_STEP.FUND_ACCOUNT);
      }
    },
    [onAccountSelected, goToStep],
  );

  const navigateToSelectAccount = useCallback(() => {
    goToStep(MODULAR_DRAWER_ADD_ACCOUNT_STEP.SELECT_ACCOUNT);
  }, [goToStep]);

  const navigateToScanAccounts = useCallback(() => {
    goToStep(MODULAR_DRAWER_ADD_ACCOUNT_STEP.SCAN_ACCOUNTS);
  }, [goToStep]);

  const navigateToAccountsAdded = useCallback(() => {
    goToStep(MODULAR_DRAWER_ADD_ACCOUNT_STEP.ACCOUNTS_ADDED);
  }, [goToStep]);

  const navigateToConnectDevice = useCallback(() => {
    goToStep(MODULAR_DRAWER_ADD_ACCOUNT_STEP.CONNECT_YOUR_DEVICE);
  }, [goToStep]);

  const handleBack = useMemo(() => {
    switch (currentStep) {
      case MODULAR_DRAWER_ADD_ACCOUNT_STEP.FUND_ACCOUNT: {
        return () => {
          if (selectedAccounts.length === 0) {
            navigateToWarningScreen();
          } else if (selectedAccounts.length === 1) {
            navigateToAccountsAdded();
          } else {
            navigateToSelectAccount();
          }
        };
      }
      case MODULAR_DRAWER_ADD_ACCOUNT_STEP.SELECT_ACCOUNT: {
        return () => {
          navigateToAccountsAdded();
        };
      }
      case MODULAR_DRAWER_ADD_ACCOUNT_STEP.SCAN_ACCOUNTS:
      case MODULAR_DRAWER_ADD_ACCOUNT_STEP.CONNECT_YOUR_DEVICE:
      case MODULAR_DRAWER_ADD_ACCOUNT_STEP.ACCOUNTS_ADDED:
      case MODULAR_DRAWER_ADD_ACCOUNT_STEP.ACCOUNTS_WARNING:
      default: {
        return undefined;
      }
    }
  }, [
    currentStep,
    selectedAccounts.length,
    navigateToWarningScreen,
    navigateToSelectAccount,
    navigateToAccountsAdded,
  ]);

  return {
    currentStep,
    navigationDirection,
    warningReason,
    emptyAccount,
    accountToFund,
    goToStep,
    navigateToWarningScreen,
    navigateToFundAccount,
    navigateToSelectAccount,
    navigateToScanAccounts,
    navigateToAccountsAdded,
    navigateToConnectDevice,
    handleBack,
  };
};
