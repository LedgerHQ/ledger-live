import React, { PureComponent } from "react";
import { connect } from "react-redux";
import { Trans, withTranslation } from "react-i18next";
import { TFunction } from "i18next";
import { compose } from "redux";
import { createStructuredSelector } from "reselect";
import { Account } from "@ledgerhq/types-live";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { addAccountsAction } from "@ledgerhq/live-wallet/addAccounts";
import { getDefaultAccountName } from "@ledgerhq/live-wallet/accountName";
import { getCurrentDevice } from "~/renderer/reducers/devices";
import { accountsSelector } from "~/renderer/reducers/accounts";
import { closeModal } from "~/renderer/actions/modals";
import Modal from "~/renderer/components/Modal";
import Stepper from "~/renderer/components/Stepper";
import { getCurrencyBridge } from "@ledgerhq/live-common/bridge/index";
import type { CantonCurrencyBridge } from "@ledgerhq/coin-canton/types";
import { OnboardStatus } from "@ledgerhq/coin-canton/types";
import StepAuthorize, { StepAuthorizeFooter } from "./steps/StepAuthorize";
import StepOnboard, { StepOnboardFooter } from "./steps/StepOnboard";
import StepFinish, { StepFinishFooter } from "./steps/StepFinish";
import { Data, StepId } from "./types";

export type Props = Data & {
  device: Device | null | undefined;
  existingAccounts: Account[];
  closeModal: (a: string) => void;
  addAccountsAction: typeof addAccountsAction;
  t: TFunction;
} & UserProps;

export type UserProps = {
  // props from user
  onClose?: () => void;
} & Data;

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
  accountName: string;
  isCreating: boolean;
  error: Error | null;
  onboardingData: any | null;
  onboardingCompleted: boolean;
  onboardingStatus: OnboardStatus;
};

const INITIAL_STATE: State = {
  stepId: StepId.ONBOARD,
  accountName: "",
  isCreating: false,
  error: null,
  onboardingData: null,
  onboardingCompleted: false,
  onboardingStatus: OnboardStatus.INIT,
};

class OnboardModal extends PureComponent<Props, State> {
  state: State = INITIAL_STATE;

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
  ] as any;

  handleReset = () => this.setState({ ...INITIAL_STATE });

  handleStepChange = (step: any) =>
    this.setState({
      stepId: step.id as StepId,
    });

  handleBeforeOpen = ({ data }: { data: Data | undefined }) => {
    // const primaryAccount = data.selectedAccounts[0];
    // const accountName = data.editedNames[primaryAccount.id];
    // this.setState({ accountName });
  };

  handleAccountCreated = (account: Account) => {
    const { addAccountsAction, existingAccounts, closeModal, editedNames } = this.props;

    const accountName = editedNames[account.id] || getDefaultAccountName(account);

    addAccountsAction({
      scannedAccounts: [account],
      existingAccounts,
      selectedIds: [account.id],
      renamings: { [account.id]: accountName },
    });

    closeModal("MODAL_CANTON_ONBOARD_ACCOUNT");
  };

  transitionTo = (stepId: StepId) => {
    this.setState({ stepId });
  };

  setOnboardingData = (data: any) => {
    this.setState({ onboardingData: data });
  };

  setOnboardingCompleted = (completed: boolean) => {
    this.setState({ onboardingCompleted: completed });
  };

  setOnboardingStatus = (status: OnboardStatus) => {
    this.setState({ onboardingStatus: status });
  };

  setError = (error: Error | null) => {
    this.setState({ error });
  };

  clearError = () => {
    this.setState({ error: null });
  };

  render() {
    const { device, currency, t, selectedAccounts, editedNames } = this.props;
    const {
      stepId,
      accountName,
      isCreating,
      error,
      onboardingData,
      onboardingCompleted,
      onboardingStatus,
    } = this.state;

    const cantonBridge = getCurrencyBridge(currency) as CantonCurrencyBridge;

    const selectedAccount = selectedAccounts[0];
    const resolvedAccountName = selectedAccount
      ? editedNames[selectedAccount.id] || getDefaultAccountName(selectedAccount)
      : `${currency.name} 1`;

    const stepperProps = {
      t,
      accountName: resolvedAccountName,
      currency,
      device,
      selectedAccounts,
      editedNames,
      cantonBridge,
      transitionTo: this.transitionTo,
      onAccountCreated: this.handleAccountCreated,
      addAccountsAction: this.props.addAccountsAction,
      existingAccounts: this.props.existingAccounts,
      closeModal: this.props.closeModal,
      onboardingData,
      onboardingCompleted,
      onboardingStatus,
      setOnboardingData: this.setOnboardingData,
      setOnboardingCompleted: this.setOnboardingCompleted,
      setOnboardingStatus: this.setOnboardingStatus,
      error,
      setError: this.setError,
      clearError: this.clearError,
      status: onboardingStatus,
    };

    return (
      <Modal
        centered
        name="MODAL_CANTON_ONBOARD_ACCOUNT"
        onHide={this.handleReset}
        onBeforeOpen={this.handleBeforeOpen}
        preventBackdropClick={stepId === StepId.ONBOARD}
        render={({ onClose }) => (
          <Stepper
            title={<Trans i18nKey="canton.addAccount.title">Add Canton Account</Trans>}
            stepId={stepId}
            onStepChange={this.handleStepChange}
            onClose={onClose}
            steps={this.STEPS as any}
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
