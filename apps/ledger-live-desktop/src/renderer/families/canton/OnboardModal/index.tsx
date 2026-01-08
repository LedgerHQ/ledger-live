import { TFunction } from "i18next";
import invariant from "invariant";
import React, { PureComponent } from "react";
import { Trans, withTranslation } from "react-i18next";
import { connect } from "react-redux";
import { compose } from "redux";
import { createStructuredSelector } from "reselect";
import { Subscription } from "rxjs";
import type { CantonCurrencyBridge } from "@ledgerhq/coin-canton/types";
import {
  AuthorizeStatus,
  OnboardStatus,
  CantonAuthorizeProgress,
  CantonAuthorizeResult,
  CantonOnboardResult,
  CantonOnboardProgress,
} from "@ledgerhq/coin-canton/types";
import { getCurrencyBridge } from "@ledgerhq/live-common/bridge/index";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { addAccountsAction } from "@ledgerhq/live-wallet/addAccounts";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { Account } from "@ledgerhq/types-live";
import { getDefaultAccountName } from "@ledgerhq/live-wallet/accountName";
import { closeModal, openModal } from "~/renderer/reducers/modals";
import type { NavigationSnapshot } from "../hooks/topologyChangeError";
import Modal from "~/renderer/components/Modal";
import Stepper, { type Step } from "~/renderer/components/Stepper";
import logger from "~/renderer/logger";
import { accountsSelector } from "~/renderer/reducers/accounts";
import { getCurrentDevice } from "~/renderer/reducers/devices";
import StepAuthorize, { StepAuthorizeFooter } from "./steps/StepAuthorize";
import StepFinish, { StepFinishFooter } from "./steps/StepFinish";
import StepOnboard, { StepOnboardFooter } from "./steps/StepOnboard";
import { OnboardingResult, StepId, StepProps } from "./types";
import { AxiosError } from "axios";

export type Props = {
  t: TFunction;
  closeModal: typeof closeModal;
  openModal: typeof openModal;
  addAccountsAction: typeof addAccountsAction;
} & UserProps;

export type UserProps = {
  currency: CryptoCurrency | null;
  device: Device | null | undefined;
  editedNames: { [accountId: string]: string };
  selectedAccounts: Account[];
  existingAccounts: Account[];
  isReonboarding?: boolean;
  accountToReonboard?: Account;
  navigationSnapshot?: NavigationSnapshot;
};

const mapStateToProps = createStructuredSelector({
  device: getCurrentDevice,
  existingAccounts: accountsSelector,
});

const mapDispatchToProps = {
  closeModal,
  openModal,
  addAccountsAction,
};

type State = {
  stepId: StepId;
  error: AxiosError | null;
  authorizeStatus: AuthorizeStatus;
  onboardingStatus: OnboardStatus;
  isProcessing: boolean;
  onboardingResult: OnboardingResult | undefined;
  isReonboarding: boolean;
};

const INITIAL_STATE: State = {
  stepId: StepId.ONBOARD,
  error: null,
  authorizeStatus: AuthorizeStatus.INIT,
  onboardingStatus: OnboardStatus.INIT,
  isProcessing: false,
  onboardingResult: undefined,
  isReonboarding: false,
};

function getCreatableAccount(
  selectedAccounts: Account[],
  isReonboarding?: boolean,
  accountToReonboard?: Account,
): Account | undefined {
  if (isReonboarding && accountToReonboard) {
    return accountToReonboard;
  }
  return selectedAccounts.find(account => !account.used);
}

function getImportableAccounts(selectedAccounts: Account[]): Account[] {
  return selectedAccounts.filter(account => account.used);
}

function resolveAccountName(
  account: Account,
  editedNames: { [accountId: string]: string },
): string {
  return editedNames[account.id] || getDefaultAccountName(account);
}

function resolveCreatableAccountName(
  creatableAccount: Account | undefined,
  currency: CryptoCurrency,
  editedNames: { [accountId: string]: string },
  importableAccountsCount: number,
): string {
  if (!creatableAccount) {
    return `${currency.name} ${importableAccountsCount + 1}`;
  }
  return resolveAccountName(creatableAccount, editedNames);
}

type AddAccountsConfig = {
  selectedAccounts: Account[];
  existingAccounts: Account[];
  editedNames: { [accountId: string]: string };
  isReonboarding?: boolean;
  accountToReonboard?: Account;
  onboardingResult?: {
    completedAccount: Account;
  };
};

function prepareAccountsForReonboarding(
  accountToReonboard: Account,
  completedAccount: Account,
  editedNames: { [accountId: string]: string },
): {
  accounts: Account[];
  renamings: { [accountId: string]: string };
} {
  const updatedAccount = {
    ...accountToReonboard,
    ...completedAccount,
    id: accountToReonboard.id,
  };

  return {
    accounts: [updatedAccount],
    renamings: {
      [updatedAccount.id]:
        editedNames[accountToReonboard.id] || getDefaultAccountName(updatedAccount),
    },
  };
}

function prepareAccountsForNewOnboarding(
  importableAccounts: Account[],
  completedAccount: Account | undefined,
  editedNames: { [accountId: string]: string },
): {
  accounts: Account[];
  renamings: { [accountId: string]: string };
} {
  const accounts = [...importableAccounts];
  if (completedAccount) {
    accounts.push(completedAccount);
  }

  // on previous step we don't have a partyId yet for onboarding account
  // so editedNames use a temporary account ID
  // since only one account is onboarded at a time, we cane filter out importableAccounts renamings
  // what is left belongs to the onboarded account
  const importableAccountIds = new Set(importableAccounts.map(acc => acc.id));
  const [, completedAccountName] =
    Object.entries(editedNames).find(([accountId]) => !importableAccountIds.has(accountId)) || [];

  const renamings = Object.fromEntries(
    accounts.map(account => {
      let accountName = editedNames[account.id];

      if (completedAccount && account.id === completedAccount.id && completedAccountName) {
        accountName = completedAccountName;
      }

      return [account.id, accountName || getDefaultAccountName(account)];
    }),
  );

  return { accounts, renamings };
}

function prepareAccountsForAdding(config: AddAccountsConfig): {
  accounts: Account[];
  renamings: { [accountId: string]: string };
} {
  const { selectedAccounts, editedNames, isReonboarding, accountToReonboard, onboardingResult } =
    config;

  const importableAccounts = getImportableAccounts(selectedAccounts);
  const completedAccount = onboardingResult?.completedAccount;

  if (isReonboarding && completedAccount && accountToReonboard) {
    return prepareAccountsForReonboarding(accountToReonboard, completedAccount, editedNames);
  }

  return prepareAccountsForNewOnboarding(importableAccounts, completedAccount, editedNames);
}

class OnboardModal extends PureComponent<Props, State> {
  state: State = INITIAL_STATE;
  cantonBridge = this.props.currency
    ? // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
      (getCurrencyBridge(this.props.currency) as CantonCurrencyBridge)
    : null;
  onboardingSubscription: Subscription | undefined;
  authorizeSubscription: Subscription | undefined;

  STEPS = [
    {
      id: StepId.ONBOARD,
      label: <Trans i18nKey="families.canton.addAccount.onboard.title" />,
      component: StepOnboard,
      footer: StepOnboardFooter,
    },
    {
      id: StepId.AUTHORIZE,
      label: <Trans i18nKey="families.canton.addAccount.auth.title" />,
      component: StepAuthorize,
      footer: StepAuthorizeFooter,
    },
    {
      id: StepId.FINISH,
      label: <Trans i18nKey="families.canton.addAccount.finish.title" />,
      component: StepFinish,
      footer: StepFinishFooter,
    },
  ];

  componentWillUnmount() {
    this.handleUnsubscribe();
  }

  handleUnsubscribe = () => {
    if (this.onboardingSubscription) {
      this.onboardingSubscription.unsubscribe();
    }
    if (this.authorizeSubscription) {
      this.authorizeSubscription.unsubscribe();
    }
  };

  handleRetryOnboardAccount = () => {
    this.handleUnsubscribe();
    this.setState({ ...INITIAL_STATE });
  };

  handleRetryPreapproval = () => {
    this.handleUnsubscribe();
    this.setState({
      authorizeStatus: AuthorizeStatus.INIT,
      isProcessing: false,
      error: null,
    });
  };

  handleStepChange = ({ id }: Step<StepId, StepProps>) => {
    this.setState({ stepId: id });
  };

  transitionTo = (stepId: StepId) => {
    this.setState({ stepId });
  };

  handleAddMore = () => {
    const { closeModal, openModal, currency } = this.props;
    this.handleAddAccounts();
    closeModal("MODAL_CANTON_ONBOARD_ACCOUNT");
    openModal("MODAL_ADD_ACCOUNTS", {
      currency,
    });
  };

  handleAddAccounts = () => {
    const {
      addAccountsAction,
      closeModal,
      openModal,
      selectedAccounts,
      existingAccounts,
      editedNames,
      isReonboarding,
      accountToReonboard,
      navigationSnapshot,
    } = this.props;
    const { onboardingResult } = this.state;

    const { accounts, renamings } = prepareAccountsForAdding({
      selectedAccounts,
      existingAccounts,
      editedNames,
      isReonboarding,
      accountToReonboard,
      onboardingResult,
    });

    addAccountsAction({
      scannedAccounts: accounts,
      existingAccounts,
      selectedIds: accounts.map(account => account.id),
      renamings,
    });

    closeModal("MODAL_CANTON_ONBOARD_ACCOUNT");

    // After re-onboarding, restore the previous state if it exists
    if (isReonboarding && navigationSnapshot) {
      if (navigationSnapshot.type === "modal") {
        openModal(navigationSnapshot.modalName, navigationSnapshot.modalData);
      } else if (navigationSnapshot.type === "transfer-proposal") {
        const { action, contractId } = navigationSnapshot.props;
        navigationSnapshot.handler(contractId, action);
      }
    }
  };

  handleOnboardAccount = () => {
    const { currency, device, selectedAccounts, isReonboarding, accountToReonboard } = this.props;
    const creatableAccount = getCreatableAccount(
      selectedAccounts,
      isReonboarding,
      accountToReonboard,
    );

    invariant(creatableAccount, "creatableAccount is required");
    invariant(device, "device is required");
    invariant(currency, "currency is required");

    this.setState({
      isProcessing: true,
      onboardingStatus: OnboardStatus.PREPARE,
      error: null,
      isReonboarding: isReonboarding || false,
    });

    if (this.onboardingSubscription) {
      this.onboardingSubscription.unsubscribe();
    }

    this.onboardingSubscription = this.cantonBridge
      ?.onboardAccount(currency, device.deviceId, creatableAccount)
      .subscribe({
        next: (data: CantonOnboardProgress | CantonOnboardResult) => {
          if ("status" in data) {
            this.setState({ onboardingStatus: data.status });
          }

          if ("account" in data && "partyId" in data) {
            this.setState({
              onboardingResult: {
                partyId: data.partyId,
                completedAccount: data.account,
              },
              onboardingStatus: OnboardStatus.SUCCESS,
              isProcessing: false,
            });
          }
        },
        complete: () => {},
        error: (error: AxiosError) => {
          logger.error("[handleOnboardAccount] failed", error);
          this.setState({
            onboardingStatus: OnboardStatus.ERROR,
            isProcessing: false,
            error,
          });
        },
      });
  };

  handleAuthorizePreapproval = () => {
    const { onboardingResult } = this.state;
    const { currency, device } = this.props;

    invariant(onboardingResult, "onboardingResult is required");
    invariant(device, "device is required");
    invariant(currency, "currency is required");

    this.setState({
      isProcessing: true,
      authorizeStatus: AuthorizeStatus.PREPARE,
      error: null,
    });

    const { completedAccount, partyId } = onboardingResult;

    if (this.authorizeSubscription) {
      this.authorizeSubscription.unsubscribe();
    }

    this.authorizeSubscription = this.cantonBridge
      ?.authorizePreapproval(currency, device.deviceId, completedAccount, partyId)
      .subscribe({
        next: (data: CantonAuthorizeProgress | CantonAuthorizeResult) => {
          if ("status" in data) {
            this.setState({ authorizeStatus: data.status });
          }
        },
        complete: () => {
          this.transitionTo(StepId.FINISH);
        },
        error: (error: AxiosError) => {
          logger.error("[handleAuthorizePreapproval] failed", error);
          this.setState({
            authorizeStatus: AuthorizeStatus.ERROR,
            isProcessing: false,
            error,
          });
        },
      });
  };

  render() {
    const {
      currency,
      device,
      editedNames,
      selectedAccounts,
      t,
      isReonboarding,
      accountToReonboard,
    } = this.props;
    const { authorizeStatus, isProcessing, onboardingResult, onboardingStatus, stepId, error } =
      this.state;

    invariant(device, "device is required"); // TODO: handle device reconnection
    invariant(currency, "currency is required");

    const importableAccounts = getImportableAccounts(selectedAccounts);
    const creatableAccount = getCreatableAccount(
      selectedAccounts,
      isReonboarding,
      accountToReonboard,
    );
    const accountName = resolveCreatableAccountName(
      creatableAccount,
      currency,
      editedNames,
      importableAccounts.length,
    );

    invariant(creatableAccount, "creatableAccount is required");

    const stepperProps: StepProps = {
      t,
      device,
      currency,
      accountName,
      editedNames,
      creatableAccount,
      importableAccounts,
      isProcessing,
      onboardingResult,
      onboardingStatus,
      authorizeStatus,
      error,
      isReonboarding: isReonboarding || this.state.isReonboarding,
      onAddAccounts: this.handleAddAccounts,
      onAddMore: this.handleAddMore,
      onAuthorizePreapproval: this.handleAuthorizePreapproval,
      onOnboardAccount: this.handleOnboardAccount,
      onRetryOnboardAccount: this.handleRetryOnboardAccount,
      onRetryPreapproval: this.handleRetryPreapproval,
      transitionTo: this.transitionTo,
    };

    return (
      <Modal
        centered
        name="MODAL_CANTON_ONBOARD_ACCOUNT"
        preventBackdropClick={stepId === StepId.ONBOARD}
        render={({ onClose }) => (
          <Stepper
            title={
              <Trans
                i18nKey={
                  isReonboarding || this.state.isReonboarding
                    ? "families.canton.addAccount.reonboard.title"
                    : "families.canton.addAccount.title"
                }
              />
            }
            stepId={stepId}
            onStepChange={this.handleStepChange}
            onClose={onClose}
            steps={this.STEPS}
            noScroll={true}
            {...stepperProps}
          />
        )}
      />
    );
  }
}

const m = compose(
  connect(mapStateToProps, mapDispatchToProps),
  withTranslation(),
)(OnboardModal) as React.ComponentType<UserProps>;

export default m;
