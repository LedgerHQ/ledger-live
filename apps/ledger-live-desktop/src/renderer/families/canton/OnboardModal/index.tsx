import { TFunction } from "i18next";
import React, { PureComponent } from "react";
import { Trans, withTranslation } from "react-i18next";
import { connect } from "react-redux";
import { compose } from "redux";
import { createStructuredSelector } from "reselect";
import type { CantonCurrencyBridge } from "@ledgerhq/coin-canton/types";
import {
  CantonPreApprovalProgress,
  CantonPreApprovalResult,
  CantonOnboardResult,
  CantonOnboardProgress,
  OnboardStatus,
  PreApprovalStatus,
} from "@ledgerhq/coin-canton/types";
import { getCurrencyBridge } from "@ledgerhq/live-common/bridge/index";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { getDefaultAccountName } from "@ledgerhq/live-wallet/accountName";
import { addAccountsAction } from "@ledgerhq/live-wallet/addAccounts";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { Account } from "@ledgerhq/types-live";
import { closeModal } from "~/renderer/actions/modals";
import Modal from "~/renderer/components/Modal";
import Stepper, { Step } from "~/renderer/components/Stepper";
import logger from "~/renderer/logger";
import { accountsSelector } from "~/renderer/reducers/accounts";
import { getCurrentDevice } from "~/renderer/reducers/devices";
import StepAuthorize, { StepAuthorizeFooter } from "./steps/StepAuthorize";
import StepFinish, { StepFinishFooter } from "./steps/StepFinish";
import StepOnboard, { StepOnboardFooter } from "./steps/StepOnboard";
import { OnboardingData, StepId } from "./types";

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
  accountName: string;
  error: Error | null;
  onboardingData: OnboardingData | null;
  onboardingCompleted: boolean;
  onboardingStatus: OnboardStatus;
  authorizeStatus: PreApprovalStatus;
  isProcessing: boolean;
  preapprovalSubscription: { unsubscribe: () => void } | null;
};

const INITIAL_STATE: State = {
  stepId: StepId.ONBOARD,
  accountName: "",
  error: null,
  onboardingData: null,
  onboardingCompleted: false,
  onboardingStatus: OnboardStatus.INIT,
  authorizeStatus: PreApprovalStatus.INIT,
  isProcessing: false,
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
  ];

  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  cantonBridge = getCurrencyBridge(this.props.currency) as CantonCurrencyBridge;

  handleReset = () => this.setState({ ...INITIAL_STATE });

  handleStepChange = (step: { id: StepId }) =>
    this.setState({
      stepId: step.id,
    });

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

  setOnboardingData = (data: OnboardingData) => {
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

  handleStartOnboarding = () => {
    logger.log("[OnboardModal] Starting onboarding process");

    this.setState({
      isProcessing: true,
      onboardingStatus: OnboardStatus.PREPARE,
      error: null,
    });

    const { device, currency, existingAccounts } = this.props;

    const creatableAccount = this.props.selectedAccounts.find(account => !account.used);

    this.cantonBridge
      .onboardAccount(currency, device.deviceId, creatableAccount!, existingAccounts)
      .subscribe({
        next: (progressData: CantonOnboardProgress | CantonOnboardResult) => {
          logger.log("[onboardAccount] progressData", progressData);

          if ("status" in progressData) {
            this.setOnboardingStatus?.(progressData.status as OnboardStatus);
          }

          if ("account" in progressData) {
            this.setState({
              onboardingData: {
                completedAccount: progressData.account as Account,
              },
              onboardingCompleted: true,
              onboardingStatus: OnboardStatus.SUCCESS,
              isProcessing: false,
            });
          }
        },
        complete: () => {
          logger.log("Canton onboarding completed successfully", onboardingResult);

          if (onboardingResult?.partyId && onboardingResult?.account) {
            logger.log("[OnboardModal] Storing onboarding data:", onboardingDataObject);
          } else {
            const errorMessage =
              "Onboarding failed: Invalid response from Canton network. Please try again.";
            logger.error(
              "[OnboardModal] No partyId in onboarding result, not marking as completed",
            );
            this.setState({
              error: new Error(errorMessage),
              onboardingStatus: OnboardStatus.ERROR,
              isProcessing: false,
            });
          }
        },
        error: (error: Error) => {
          logger.error("Canton account creation failed", error);

          // Provide user-friendly error messages based on error type
          let userMessage = "Onboarding failed. Please try again.";
          if (error.message.includes("timeout")) {
            userMessage = "Request timed out. Please check your connection and try again.";
          } else if (error.message.includes("network")) {
            userMessage = "Network error. Please check your internet connection and try again.";
          } else if (error.message.includes("device")) {
            userMessage = "Device error. Please check your Ledger device connection and try again.";
          }

          this.setState({
            error: new Error(userMessage),
            onboardingStatus: OnboardStatus.ERROR,
            isProcessing: false,
          });
        },
      });
  };

  setIsProcessing = (isProcessing: boolean) => {
    this.setState({ isProcessing });
  };

  handlePreapproval = () => {
    this.setState({
      isProcessing: true,
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

    const { completedAccount } = onboardingData;
    console.log(
      "completedAccount",
      completedAccount,
      "completedAccount.xpub",
      completedAccount.xpub,
    );

    let preapprovalResult: CantonPreApprovalResult | null = null;
    const { device } = this.props;

    const subscription = this.cantonBridge
      .authorizePreapproval(currency, device.deviceId, completedAccount, completedAccount.xpub!)
      .subscribe({
        next: (progressData: CantonPreApprovalProgress | CantonPreApprovalResult) => {
          if ("isApproved" in progressData) {
            preapprovalResult = {
              isApproved: progressData.isApproved,
            };
          }

          if ("status" in progressData) {
            this.setState({ authorizeStatus: progressData.status });
          }
        },
        complete: () => {
          logger.log("Canton preapproval completed", preapprovalResult);

          if (!preapprovalResult || !preapprovalResult.isApproved) {
            const errorMessage =
              "Transaction pre-approval was rejected. Please try again or check your device.";
            logger.error("Pre-approval failed: No approval received");
            this.setState({
              error: new Error(errorMessage),
              isProcessing: false,
              preapprovalSubscription: null,
            });
            return;
          }

          this.setState({
            preapprovalSubscription: null,
          });

          this.transitionTo(StepId.FINISH);
        },
        error: (error: Error) => {
          logger.error("Canton preapproval failed", error);

          // Provide user-friendly error messages for preapproval failures
          let userMessage = "Pre-approval failed. Please try again.";
          if (error.message.includes("timeout")) {
            userMessage = "Pre-approval timed out. Please check your device and try again.";
          } else if (error.message.includes("rejected")) {
            userMessage = "Pre-approval was rejected on your device. Please try again.";
          } else if (error.message.includes("network")) {
            userMessage =
              "Network error during pre-approval. Please check your connection and try again.";
          }

          this.setState({
            error: new Error(userMessage),
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
      onboardingData,
      onboardingCompleted,
      onboardingStatus,
      authorizeStatus,
      isProcessing,
    } = this.state;

    const importableAccounts = selectedAccounts.filter(account => account.used);
    const creatableAccount = selectedAccounts.find(account => !account.used);

    const accountName = creatableAccount
      ? editedNames[creatableAccount.id] || getDefaultAccountName(creatableAccount!)
      : `${currency.name} ${importableAccounts.length + 1}`;

    const stepperProps = {
      t,
      accountName,
      importableAccounts,
      creatableAccount,
      editedNames,
      currency,
      device,
      transitionTo: this.transitionTo,
      onAddAccounts: this.handleAddAccounts,
      onboardingCompleted,
      onboardingData,
      onboardingStatus,
      authorizeStatus,
      status: onboardingStatus,
      isProcessing,
      handlePreapproval: this.handlePreapproval,
      startOnboarding: this.handleStartOnboarding,
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
