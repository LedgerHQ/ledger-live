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
import { getDefaultAccountName } from "@ledgerhq/live-wallet/accountName";
import { addAccountsAction } from "@ledgerhq/live-wallet/addAccounts";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { Account } from "@ledgerhq/types-live";
import { closeModal, openModal } from "~/renderer/actions/modals";
import Modal from "~/renderer/components/Modal";
import Stepper, { type Step } from "~/renderer/components/Stepper";
import logger from "~/renderer/logger";
import { accountsSelector } from "~/renderer/reducers/accounts";
import { getCurrentDevice } from "~/renderer/reducers/devices";
import StepAuthorize, { StepAuthorizeFooter } from "./steps/StepAuthorize";
import StepFinish, { StepFinishFooter } from "./steps/StepFinish";
import StepOnboard, { StepOnboardFooter } from "./steps/StepOnboard";
import { OnboardingResult, StepId, StepProps } from "./types";

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
  error: Error | null;
  authorizeStatus: AuthorizeStatus;
  onboardingStatus: OnboardStatus;
  isProcessing: boolean;
  onboardingResult: OnboardingResult | undefined;
};

const INITIAL_STATE: State = {
  stepId: StepId.ONBOARD,
  error: null,
  authorizeStatus: AuthorizeStatus.INIT,
  onboardingStatus: OnboardStatus.INIT,
  isProcessing: false,
  onboardingResult: undefined,
};

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

  handleRetry = () => {
    this.handleUnsubscribe();
    this.setState({ ...INITIAL_STATE });
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
    const { addAccountsAction, closeModal, selectedAccounts, existingAccounts, editedNames } =
      this.props;
    const { onboardingResult } = this.state;
    const importableAccounts = selectedAccounts.filter(account => account.used);
    const completedAccount = onboardingResult?.completedAccount;
    const accounts = [...importableAccounts];
    if (completedAccount) {
      accounts.push(completedAccount);
    }
    const renamings = Object.fromEntries(
      accounts.map(account => [
        account.id,
        editedNames[account.id] || getDefaultAccountName(account),
      ]),
    );

    addAccountsAction({
      scannedAccounts: accounts,
      existingAccounts,
      selectedIds: accounts.map(account => account.id),
      renamings,
    });

    closeModal("MODAL_CANTON_ONBOARD_ACCOUNT");
  };

  handleOnboardAccount = () => {
    const { currency, device, selectedAccounts } = this.props;
    const creatableAccount = selectedAccounts.find(account => !account.used);

    invariant(creatableAccount, "creatableAccount is required");
    invariant(device, "device is required");
    invariant(currency, "currency is required");

    this.setState({
      isProcessing: true,
      onboardingStatus: OnboardStatus.PREPARE,
      error: null,
    });

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
        error: (error: Error) => {
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
        error: (error: Error) => {
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
    const { currency, device, editedNames, selectedAccounts, t } = this.props;
    const { authorizeStatus, isProcessing, onboardingResult, onboardingStatus, stepId } =
      this.state;

    invariant(device, "device is required"); // TODO: handle device reconnection
    invariant(currency, "currency is required");

    const importableAccounts = selectedAccounts.filter(account => account.used);
    const creatableAccount = selectedAccounts.find(account => !account.used);

    const accountName = creatableAccount
      ? editedNames[creatableAccount.id] || getDefaultAccountName(creatableAccount)
      : `${currency.name} ${importableAccounts.length + 1}`;

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
      onAddAccounts: this.handleAddAccounts,
      onAddMore: this.handleAddMore,
      onAuthorizePreapproval: this.handleAuthorizePreapproval,
      onOnboardAccount: this.handleOnboardAccount,
      onRetry: this.handleRetry,
      transitionTo: this.transitionTo,
    };

    return (
      <Modal
        centered
        name="MODAL_CANTON_ONBOARD_ACCOUNT"
        preventBackdropClick={stepId === StepId.ONBOARD}
        render={({ onClose }) => (
          <Stepper
            title={<Trans i18nKey="families.canton.addAccount.title" />}
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
