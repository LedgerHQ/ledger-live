import { useCallback, useMemo, useState } from "react";
import type { Account, TokenAccount } from "@ledgerhq/types-live";
import type { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { setDrawer } from "~/renderer/drawers/Provider";
import useAddAccountAnalytics from "LLD/features/AddAccountDrawer/analytics/useAddAccountAnalytics";
import type { WarningReason } from "LLD/features/AddAccountDrawer/domain";
import {
  ADD_ACCOUNT_EVENTS_NAME,
  ADD_ACCOUNT_FLOW_NAME,
  ADD_ACCOUNT_PAGE_NAME,
} from "LLD/features/AddAccountDrawer/analytics/addAccount.types";
import { getAccountToReturn } from "LLD/features/AddAccountDrawer/utils/getAccountToReturn";
import { ALEO_MODULAR_DRAWER_ADD_ACCOUNT_STEP } from "./domain";
import { useNavigation } from "./useNavigation";

interface UseAddAccountFlowNavigationProps {
  selectedAccounts: Account[];
  onAccountSelected?: (account: Account | TokenAccount, parentAccount?: Account) => void;
  originalCurrency?: CryptoOrTokenCurrency;
}

export const useAddAccountFlowNavigation = ({
  selectedAccounts,
  onAccountSelected,
  originalCurrency,
}: UseAddAccountFlowNavigationProps) => {
  const { currentStep, navigationDirection, goToStep } = useNavigation();
  const { trackAddAccountEvent } = useAddAccountAnalytics();

  const [warningReason, setWarningReason] = useState<WarningReason>();
  const [emptyAccount, setEmptyAccount] = useState<Account>();
  const [accountToFund, setAccountToFund] = useState<Account>();
  const [accountToEdit, setAccountToEdit] = useState<Account>();

  const navigateToWarningScreen = useCallback(
    (reason?: WarningReason, account?: Account) => {
      if (!warningReason && !emptyAccount) {
        setWarningReason(reason);
        setEmptyAccount(account);
      }
      goToStep(ALEO_MODULAR_DRAWER_ADD_ACCOUNT_STEP.ACCOUNTS_WARNING);
    },
    [goToStep, warningReason, emptyAccount],
  );

  const navigateToFundAccount = useCallback(
    (account: Account) => {
      setAccountToFund(account);
      if (onAccountSelected) {
        const { account: accountToReturn, parent } = getAccountToReturn(account, originalCurrency);
        onAccountSelected(accountToReturn, parent);
      } else {
        goToStep(ALEO_MODULAR_DRAWER_ADD_ACCOUNT_STEP.FUND_ACCOUNT);
      }
    },
    [onAccountSelected, originalCurrency, goToStep],
  );

  const navigateToEditAccountName = useCallback(
    (account: Account) => {
      setAccountToEdit(account);
      if (onAccountSelected) {
        const { account: accountToReturn, parent } = getAccountToReturn(account, originalCurrency);
        onAccountSelected(accountToReturn, parent);
      } else {
        goToStep(ALEO_MODULAR_DRAWER_ADD_ACCOUNT_STEP.EDIT_ACCOUNT_NAME);
      }
    },
    [onAccountSelected, originalCurrency, goToStep],
  );

  const navigateToSelectAccount = useCallback(() => {
    goToStep(ALEO_MODULAR_DRAWER_ADD_ACCOUNT_STEP.SELECT_ACCOUNT);
  }, [goToStep]);

  const navigateToScanAccounts = useCallback(() => {
    goToStep(ALEO_MODULAR_DRAWER_ADD_ACCOUNT_STEP.SCAN_ACCOUNTS);
  }, [goToStep]);

  const navigateToAccountsAdded = useCallback(() => {
    goToStep(ALEO_MODULAR_DRAWER_ADD_ACCOUNT_STEP.ACCOUNTS_ADDED);
  }, [goToStep]);

  const navigateToConnectDevice = useCallback(() => {
    goToStep(ALEO_MODULAR_DRAWER_ADD_ACCOUNT_STEP.CONNECT_YOUR_DEVICE);
  }, [goToStep]);

  const navigateToViewKeyWarning = useCallback(() => {
    goToStep(ALEO_MODULAR_DRAWER_ADD_ACCOUNT_STEP.VIEW_KEY_WARNING);
  }, [goToStep]);

  const navigateToViewKeyApprove = useCallback(() => {
    goToStep(ALEO_MODULAR_DRAWER_ADD_ACCOUNT_STEP.VIEW_KEY_APPROVE);
  }, [goToStep]);

  const closeDrawer = useCallback(() => {
    setDrawer();
  }, []);

  const navigateBack = useMemo(
    (track: boolean = true) => {
      switch (currentStep) {
        case ALEO_MODULAR_DRAWER_ADD_ACCOUNT_STEP.EDIT_ACCOUNT_NAME: {
          return () => {
            if (track) {
              trackAddAccountEvent(ADD_ACCOUNT_EVENTS_NAME.ADD_ACCOUNT_BUTTON_CLICKED, {
                button: "Back",
                page: ADD_ACCOUNT_PAGE_NAME.EDIT_ACCOUNT_NAME_ACTIONS,
                flow: ADD_ACCOUNT_FLOW_NAME,
              });
            }
            if (selectedAccounts.length === 0) {
              navigateToWarningScreen();
            } else {
              navigateToAccountsAdded();
            }
          };
        }
        case ALEO_MODULAR_DRAWER_ADD_ACCOUNT_STEP.FUND_ACCOUNT: {
          return () => {
            if (track) {
              trackAddAccountEvent(ADD_ACCOUNT_EVENTS_NAME.ADD_ACCOUNT_BUTTON_CLICKED, {
                button: "Back",
                page: ADD_ACCOUNT_PAGE_NAME.FUNDING_ACTIONS,
                flow: ADD_ACCOUNT_FLOW_NAME,
              });
            }
            if (selectedAccounts.length === 0) {
              navigateToWarningScreen();
            } else if (selectedAccounts.length === 1) {
              navigateToAccountsAdded();
            } else {
              navigateToSelectAccount();
            }
          };
        }
        case ALEO_MODULAR_DRAWER_ADD_ACCOUNT_STEP.SELECT_ACCOUNT: {
          return () => {
            if (track) {
              trackAddAccountEvent(ADD_ACCOUNT_EVENTS_NAME.ADD_ACCOUNT_BUTTON_CLICKED, {
                button: "Back",
                page: ADD_ACCOUNT_PAGE_NAME.FUND_ACCOUNT_DRAWER_LIST,
                flow: ADD_ACCOUNT_FLOW_NAME,
              });
            }
            navigateToAccountsAdded();
          };
        }
        case ALEO_MODULAR_DRAWER_ADD_ACCOUNT_STEP.ACCOUNTS_ADDED:
        case ALEO_MODULAR_DRAWER_ADD_ACCOUNT_STEP.ACCOUNTS_WARNING:
        case ALEO_MODULAR_DRAWER_ADD_ACCOUNT_STEP.CONNECT_YOUR_DEVICE:
        case ALEO_MODULAR_DRAWER_ADD_ACCOUNT_STEP.VIEW_KEY_WARNING:
        case ALEO_MODULAR_DRAWER_ADD_ACCOUNT_STEP.SCAN_ACCOUNTS:
        case ALEO_MODULAR_DRAWER_ADD_ACCOUNT_STEP.VIEW_KEY_APPROVE:
        default: {
          return undefined;
        }
      }
    },
    [
      currentStep,
      selectedAccounts.length,
      navigateToWarningScreen,
      navigateToSelectAccount,
      navigateToAccountsAdded,
      trackAddAccountEvent,
    ],
  );

  return {
    accountToEdit,
    accountToFund,
    currentStep,
    emptyAccount,
    closeDrawer,
    goToStep,
    navigateBack,
    navigateToAccountsAdded,
    navigateToConnectDevice,
    navigateToEditAccountName,
    navigateToFundAccount,
    navigateToScanAccounts,
    navigateToSelectAccount,
    navigateToWarningScreen,
    navigateToViewKeyWarning,
    navigateToViewKeyApprove,
    navigationDirection,
    warningReason,
  };
};
