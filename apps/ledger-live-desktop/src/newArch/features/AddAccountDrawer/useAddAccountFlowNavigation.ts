import { Account } from "@ledgerhq/types-live";
import { useCallback, useMemo, useState } from "react";
import {
  ADD_ACCOUNT_EVENTS_NAME,
  ADD_ACCOUNT_FLOW_NAME,
  ADD_ACCOUNT_PAGE_NAME,
} from "./analytics/addAccount.types";
import useAddAccountAnalytics from "./analytics/useAddAccountAnalytics";
import { MODULAR_DRAWER_ADD_ACCOUNT_STEP, WarningReason } from "./domain";
import { useNavigation } from "./useNavigation";

interface UseAddAccountFlowNavigationProps {
  selectedAccounts: Account[];
  onAccountSelected?: (account: Account) => void;
}

export interface AccountsOnboardState {
  selectedAccounts: Account[];
  editedNames: { [accountId: string]: string };
  isReonboarding?: boolean;
  accountToReonboard?: Account;
}

export const useAddAccountFlowNavigation = ({
  selectedAccounts,
  onAccountSelected,
}: UseAddAccountFlowNavigationProps) => {
  const { currentStep, navigationDirection, goToStep } = useNavigation();
  const { trackAddAccountEvent } = useAddAccountAnalytics();

  const [warningReason, setWarningReason] = useState<WarningReason>();
  const [emptyAccount, setEmptyAccount] = useState<Account>();
  const [accountToFund, setAccountToFund] = useState<Account>();
  const [accountToEdit, setAccountToEdit] = useState<Account>();
  const [accountsOnboardState, setAccountsOnboardState] = useState<
    AccountsOnboardState | undefined
  >();

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

  const navigateToEditAccountName = useCallback(
    (account: Account) => {
      setAccountToEdit(account);
      if (onAccountSelected) {
        onAccountSelected(account);
      } else {
        goToStep(MODULAR_DRAWER_ADD_ACCOUNT_STEP.EDIT_ACCOUNT_NAME);
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

  const navigateToAccountsOnboard = useCallback(
    (state: AccountsOnboardState) => {
      setAccountsOnboardState(state);
      goToStep(MODULAR_DRAWER_ADD_ACCOUNT_STEP.ACCOUNTS_ONBOARD);
    },
    [goToStep],
  );

  const navigateBack = useMemo(
    (track: boolean = true) => {
      switch (currentStep) {
        case MODULAR_DRAWER_ADD_ACCOUNT_STEP.EDIT_ACCOUNT_NAME: {
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
        case MODULAR_DRAWER_ADD_ACCOUNT_STEP.FUND_ACCOUNT: {
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
        case MODULAR_DRAWER_ADD_ACCOUNT_STEP.SELECT_ACCOUNT: {
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
        case MODULAR_DRAWER_ADD_ACCOUNT_STEP.ACCOUNTS_ONBOARD: {
          return () => {
            if (track) {
              trackAddAccountEvent(ADD_ACCOUNT_EVENTS_NAME.ADD_ACCOUNT_BUTTON_CLICKED, {
                button: "Back",
                page: ADD_ACCOUNT_PAGE_NAME.LOOKING_FOR_ACCOUNTS,
                flow: ADD_ACCOUNT_FLOW_NAME,
              });
            }
            navigateToScanAccounts();
          };
        }
        case MODULAR_DRAWER_ADD_ACCOUNT_STEP.ACCOUNTS_ADDED:
        case MODULAR_DRAWER_ADD_ACCOUNT_STEP.ACCOUNTS_WARNING:
        case MODULAR_DRAWER_ADD_ACCOUNT_STEP.CONNECT_YOUR_DEVICE:
        case MODULAR_DRAWER_ADD_ACCOUNT_STEP.SCAN_ACCOUNTS:
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
      navigateToScanAccounts,
      trackAddAccountEvent,
    ],
  );

  return {
    accountToEdit,
    accountToFund,
    accountsOnboardState,
    currentStep,
    emptyAccount,
    goToStep,
    navigateBack,
    navigateToAccountsAdded,
    navigateToAccountsOnboard,
    navigateToConnectDevice,
    navigateToEditAccountName,
    navigateToFundAccount,
    navigateToScanAccounts,
    navigateToSelectAccount,
    navigateToWarningScreen,
    navigationDirection,
    warningReason,
  };
};
