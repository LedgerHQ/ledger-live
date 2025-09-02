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
import { encodeAccountId } from "@ledgerhq/coin-framework/account/index";
import {
  OnboardStatus,
  PreApprovalStatus,
  CantonPreApprovalProgress,
  CantonPreApprovalResult,
} from "@ledgerhq/coin-canton/types";
import {
  getDerivationScheme,
  runAccountDerivationScheme,
} from "@ledgerhq/coin-framework/derivation";
import logger from "~/renderer/logger";
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
  authorizeStatus: PreApprovalStatus;
  isProcessing: boolean;
  showConfirmation: boolean;
  progress: number;
  message: string;
  preapprovalSubscription: any | null;
};

const INITIAL_STATE: State = {
  stepId: StepId.ONBOARD,
  accountName: "",
  isCreating: false,
  error: null,
  onboardingData: null,
  onboardingCompleted: false,
  onboardingStatus: OnboardStatus.INIT,
  authorizeStatus: PreApprovalStatus.INIT,
  isProcessing: false,
  showConfirmation: false,
  progress: 0,
  message: "",
  preapprovalSubscription: null,
};

class OnboardModal extends PureComponent<Props, State> {
  state: State = INITIAL_STATE;

  componentWillUnmount() {
    if (this.state.preapprovalSubscription) {
      logger.log("Cleaning up preapproval subscription");
      this.state.preapprovalSubscription.unsubscribe();
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
    const { addAccountsAction, existingAccounts, closeModal, editedNames, currency } = this.props;
    const { onboardingData, accountName } = this.state;
    const address = onboardingData?.partyId;
    // TODO: we need better solution ?
    const xpubOrAddress = address?.replace(/:/g, "_") || "";
    const accountId = encodeAccountId({
      type: "js",
      version: "2",
      currencyId: currency.id,
      xpubOrAddress,
      derivationMode: "",
    });
    const completedAccount = {
      ...onboardingData?.completedAccount,
      id: accountId,
      address: xpubOrAddress,
      freshAddress: xpubOrAddress,
    };

    addAccountsAction({
      scannedAccounts: [completedAccount],
      existingAccounts,
      selectedIds: [completedAccount.id],
      renamings: { [completedAccount.id]: accountName },
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

  setAuthorizeStatus = (status: PreApprovalStatus) => {
    this.setState({ authorizeStatus: status });
  };

  setError = (error: Error | null) => {
    this.setState({ error });
  };

  clearError = () => {
    this.setState({ error: null });
  };

  handlePreapproval = () => {
    console.log("[OnboardModal] Starting preapproval process");

    this.setState({
      isProcessing: true,
      progress: 0,
      message: "Starting transaction pre-approval...",
      error: null,
    });

    const { onboardingData } = this.state;
    const { currency } = this.props;

    if (!onboardingData) {
      this.setState({
        error: new Error("No onboarding data found in modal state"),
        isProcessing: false,
      });
      return;
    }

    const { partyId, address, device: deviceId, accountIndex } = onboardingData;

    const derivationScheme = getDerivationScheme({ derivationMode: "", currency });
    const derivationPath = runAccountDerivationScheme(derivationScheme, currency, {
      account: accountIndex,
    });

    const cantonBridge = getCurrencyBridge(currency) as CantonCurrencyBridge;
    let preapprovalResult: CantonPreApprovalResult | null = null;

    const subscription = cantonBridge
      .authorizePreapproval(deviceId, derivationPath, partyId)
      .subscribe({
        next: (progressData: CantonPreApprovalProgress | CantonPreApprovalResult) => {
          logger.log("Canton preapproval progress", progressData);

          // Handle final result (CantonPreApprovalResult has approved property)
          if ("approved" in progressData) {
            preapprovalResult = progressData;
            this.setState({ showConfirmation: true });
          }

          // Handle progress updates (CantonPreApprovalProgress has status)
          if ("status" in progressData) {
            this.setState({ authorizeStatus: progressData.status });
          }
          if ("message" in progressData) {
            this.setState({ message: `Pre-approval: ${progressData.message}` });
          }
        },
        complete: () => {
          logger.log("Canton preapproval completed", preapprovalResult);

          if (!preapprovalResult?.approved) {
            const errorMessage = `Transaction pre-approval failed: ${preapprovalResult?.message || "Unknown error"}`;
            logger.error(errorMessage);
            this.setState({
              error: new Error(errorMessage),
              isProcessing: false,
              preapprovalSubscription: null,
            });
            return;
          }

          this.setState({
            progress: 100,
            message: "Pre-approval completed successfully!",
            preapprovalSubscription: null,
          });

          this.transitionTo(StepId.FINISH);
        },
        error: (error: Error) => {
          logger.error("Canton preapproval failed", error);
          this.setState({
            error,
            isProcessing: false,
            preapprovalSubscription: null,
          });
        },
      });

    this.setState({ preapprovalSubscription: subscription });
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
      authorizeStatus,
      isProcessing,
      showConfirmation,
      progress,
      message,
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
      setAuthorizeStatus: this.setAuthorizeStatus,
      authorizeStatus,
      error,
      setError: this.setError,
      clearError: this.clearError,
      status: onboardingStatus,
      isProcessing,
      showConfirmation,
      progress,
      message,
      handlePreapproval: this.handlePreapproval,
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
