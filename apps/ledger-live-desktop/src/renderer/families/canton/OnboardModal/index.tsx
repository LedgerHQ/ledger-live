import { TFunction } from "i18next";
import invariant from "invariant";
import React, { PureComponent } from "react";
import { Trans, withTranslation } from "react-i18next";
import { connect } from "react-redux";
import { compose } from "redux";
import { createStructuredSelector } from "reselect";
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
import { closeModal } from "~/renderer/actions/modals";
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
  currency: CryptoCurrency;
  device: Device;
  selectedAccounts: Account[];
  editedNames: {
    [accountId: string]: string;
  };
} & {
  device: Device | null | undefined;
  existingAccounts: Account[];
  closeModal: (a: string) => void;
  addAccountsAction: typeof addAccountsAction;
  t: TFunction;
};

const mapStateToProps = createStructuredSelector({
  device: getCurrentDevice,
  existingAccounts: accountsSelector,
});

const mapDispatchToProps = {
  closeModal,
  addAccountsAction,
};

type State = {
  stepId: StepId;
  error: Error | null;
  authorizeStatus: AuthorizeStatus;
  onboardingStatus: OnboardStatus;
  isProcessing: boolean;
  onboardingResult: OnboardingResult | undefined;
  authorizeSubscription: { unsubscribe: () => void } | null;
  onboardingSubscription: { unsubscribe: () => void } | null;
};

const INITIAL_STATE: State = {
  stepId: StepId.ONBOARD,
  error: null,
  authorizeStatus: AuthorizeStatus.INIT,
  onboardingStatus: OnboardStatus.INIT,
  isProcessing: false,
  onboardingResult: undefined,
  onboardingSubscription: null,
  authorizeSubscription: null,
};

class OnboardModal extends PureComponent<Props, State> {
  state: State = INITIAL_STATE;

  componentWillUnmount() {
    if (this.state.authorizeSubscription) {
      logger.log("Cleaning up preapproval subscription");
      this.state.authorizeSubscription.unsubscribe();
    }
  }

  STEPS = [
    {
      id: StepId.ONBOARD,
      label: <Trans i18nKey="canton.addAccount.steps.onboarding">Onboarding</Trans>,
      component: StepOnboard,
      footer: StepOnboardFooter,
    },
    {
      id: StepId.AUTHORIZE,
      label: <Trans i18nKey="canton.addAccount.steps.authorization">Authorization</Trans>,
      component: StepAuthorize,
      footer: StepAuthorizeFooter,
    },
    {
      id: StepId.FINISH,
      label: <Trans i18nKey="canton.addAccount.steps.complete">Confirmation</Trans>,
      component: StepFinish,
      footer: StepFinishFooter,
    },
  ];

  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  cantonBridge = getCurrencyBridge(this.props.currency) as CantonCurrencyBridge;

  handleReset = () => this.setState({ ...INITIAL_STATE });

  handleStepChange = ({ id }: Step<StepId, StepProps>) => {
    this.setState({
      stepId: id,
    });
  };

  handleAddAccounts = (accounts: Account[] = []) => {
    const { addAccountsAction, existingAccounts, closeModal, editedNames } = this.props;

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

  transitionTo = (stepId: StepId) => {
    this.setState({ stepId });
  };

  handleOnboardAccount = () => {
    const { currency, device, existingAccounts, selectedAccounts } = this.props;
    const creatableAccount = selectedAccounts.find(account => !account.used);

    invariant(creatableAccount, "creatableAccount is required");

    this.setState({
      isProcessing: true,
      onboardingStatus: OnboardStatus.PREPARE,
      error: null,
    });

    this.cantonBridge
      .onboardAccount(currency, device.deviceId, creatableAccount, existingAccounts)
      .subscribe({
        next: (data: CantonOnboardProgress | CantonOnboardResult) => {
          logger.log("[onboardAccount] data", data);

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
          logger.error("[onboardAccount] failed", error);
        },
      });
  };

  handleAuthorizePreapproval = () => {
    const { onboardingResult } = this.state;
    const { currency, device } = this.props;

    invariant(onboardingResult, "onboardingResult is required");

    this.setState({
      isProcessing: true,
      authorizeStatus: AuthorizeStatus.PREPARE,
      error: null,
    });

    const { completedAccount } = onboardingResult;
    console.log("completedAccount", completedAccount);

    const authorizeSubscription = this.cantonBridge
      .authorizePreapproval(currency, device.deviceId, completedAccount, completedAccount.xpub!)
      .subscribe({
        next: (data: CantonAuthorizeProgress | CantonAuthorizeResult) => {
          logger.log("[authorizePreapproval] data", data);

          if ("status" in data) {
            this.setState({ authorizeStatus: data.status });
          }
        },
        complete: () => {
          this.setState({ authorizeSubscription: null });
          this.transitionTo(StepId.FINISH);
        },
        error: (error: Error) => {
          logger.error("[onboardAccount] failed", error);
        },
      });

    this.setState({ authorizeSubscription });
  };

  render() {
    const { currency, device, editedNames, selectedAccounts, t } = this.props;
    const { authorizeStatus, isProcessing, onboardingResult, onboardingStatus, stepId } =
      this.state;

    const importableAccounts = selectedAccounts.filter(account => account.used);
    const creatableAccount = selectedAccounts.find(account => !account.used);

    const accountName = creatableAccount
      ? editedNames[creatableAccount.id] || getDefaultAccountName(creatableAccount!)
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
      onAuthorizePreapproval: this.handleAuthorizePreapproval,
      onOnboardAccount: this.handleOnboardAccount,
      transitionTo: this.transitionTo,
    };

    return (
      <Modal
        centered
        name="MODAL_CANTON_ONBOARD_ACCOUNT"
        onHide={this.handleReset}
        preventBackdropClick={stepId === StepId.ONBOARD}
        render={({ onClose }) => (
          <Stepper
            title={<Trans i18nKey="canton.addAccount.title">Add Canton Account</Trans>}
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

const m = compose(connect(mapStateToProps, mapDispatchToProps), withTranslation())(OnboardModal);

export default m;
