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
import Stepper, { Step } from "~/renderer/components/Stepper";
import { getCurrencyBridge } from "@ledgerhq/live-common/bridge/index";
import type { CantonCurrencyBridge } from "@ledgerhq/coin-canton/types";
import {
  OnboardStatus,
  PreApprovalStatus,
  CantonPreApprovalProgress,
  CantonPreApprovalResult,
} from "@ledgerhq/coin-canton/types";
import logger from "~/renderer/logger";
import StepAuthorize, { StepAuthorizeFooter } from "./steps/StepAuthorize";
import StepOnboard, { StepOnboardFooter } from "./steps/StepOnboard";
import StepFinish, { StepFinishFooter } from "./steps/StepFinish";
import { Data, StepId, OnboardingData, SigningData } from "./types";

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
  onboardingData: OnboardingData | null;
  onboardingCompleted: boolean;
  onboardingStatus: OnboardStatus;
  authorizeStatus: PreApprovalStatus;
  signingData: SigningData | null;
  isProcessing: boolean;
  showConfirmation: boolean;
  progress: number;
  message: string;
  preapprovalSubscription: { unsubscribe: () => void } | null;
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
  signingData: null,
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
  ];

  handleReset = () => this.setState({ ...INITIAL_STATE });

  handleStepChange = (step: { id: StepId }) =>
    this.setState({
      stepId: step.id,
    });

  handleBeforeOpen = ({ data: _data }: { data: Data | undefined }) => {
    // const primaryAccount = data.selectedAccounts[0];
    // const accountName = data.editedNames[primaryAccount.id];
    // this.setState({ accountName });
  };

  handleAddAccounts = (accounts: Account[] = []) => {
    const { addAccountsAction, existingAccounts, closeModal, editedNames } = this.props;

    const renamings = Object.fromEntries(
      accounts.map(account => [
        account.id,
        editedNames[account.id] || getDefaultAccountName(account!),
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

  setSigningData = (signingData: SigningData) => {
    this.setState({ signingData });
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
    const { accountName } = this.state;

    // Get creatableAccount from stepper props
    // const importableAccounts = this.props.selectedAccounts.filter(account => account.used);
    const creatableAccount = this.props.selectedAccounts.find(account => !account.used);

    if (!device || !currency) {
      this.setState({
        error: new Error("Device or currency missing"),
        isProcessing: false,
      });
      return;
    }

    const cantonBridge = getCurrencyBridge(currency) as CantonCurrencyBridge;
    if (!cantonBridge.onboardAccount) {
      this.setState({
        error: new Error("Canton bridge does not support onboardAccount"),
        isProcessing: false,
      });
      return;
    }

    const accountIndex = 0;
    let onboardingResult: {
      partyId: string;
      account: Partial<Account>;
      publicKey?: string;
      address?: string;
      transactionHash?: string;
    } | null = null;

    cantonBridge
      .onboardAccount(device.deviceId, currency, creatableAccount!, existingAccounts)
      .subscribe({
        next: (progressData: Record<string, unknown>) => {
          logger.log("Canton onboarding progress", progressData);

          // Handle progress updates (CantonOnboardProgress has status)
          if ("status" in progressData) {
            // const statusMessage = getStatusMessage(progressData.status as OnboardStatus);
            // this.setSigningData(progressData.status, statusMessage);
            this.setOnboardingStatus?.(progressData.status as OnboardStatus);

            if (progressData.status === OnboardStatus.SIGN) {
              logger.log("Entering signing phase, storing transaction data");
              const signingData: SigningData = {
                partyId:
                  ((progressData as Record<string, unknown>).partyId as string) ||
                  "pending-party-id",
                publicKey:
                  ((progressData as Record<string, unknown>).publicKey as string) ||
                  "pending-public-key",
                transactionData:
                  (progressData as Record<string, unknown>).transactionData || progressData,
                combinedHash:
                  ((progressData as Record<string, unknown>).combinedHash as string) ||
                  ((progressData as Record<string, unknown>).combined_hash as string) ||
                  "",
                derivationPath: (progressData as Record<string, unknown>).derivationPath as string,
              };
              this.setSigningData(signingData);
            }
          }

          // Handle final result
          if ("partyId" in progressData && !("status" in progressData)) {
            onboardingResult = {
              partyId: progressData.partyId as string,
              account: progressData.account as Partial<Account>,
              publicKey: "generated-public-key",
              address: progressData.partyId as string,
            };
          }
        },
        complete: () => {
          logger.log("Canton onboarding completed successfully", onboardingResult);

          if (onboardingResult?.partyId && onboardingResult?.account) {
            const onboardingDataObject = {
              partyId: onboardingResult.partyId,
              address: onboardingResult.address || "",
              publicKey: onboardingResult.publicKey || "",
              device: device.deviceId,
              accountIndex,
              currency: currency.id,
              accountName: accountName,
              transactionHash: onboardingResult.transactionHash || "",
              completedAccount: onboardingResult.account || creatableAccount,
            };

            logger.log("[OnboardModal] Storing onboarding data:", onboardingDataObject);
            this.setState({
              onboardingData: onboardingDataObject as OnboardingData,
              onboardingCompleted: true,
              onboardingStatus: OnboardStatus.SUCCESS,
              isProcessing: false,
            });
          } else {
            logger.error(
              "[OnboardModal] No partyId in onboarding result, not marking as completed",
            );
            this.setState({
              error: new Error("Onboarding failed: No party ID received"),
              isProcessing: false,
            });
          }
        },
        error: (error: Error) => {
          logger.error("Canton account creation failed", error);
          this.setState({
            error,
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

    const { partyId, address: _address, device: deviceId, completedAccount } = onboardingData;

    const cantonBridge = getCurrencyBridge(currency) as CantonCurrencyBridge;
    let preapprovalResult: CantonPreApprovalResult | null = null;

    const subscription = cantonBridge
      .authorizePreapproval(currency, deviceId, completedAccount, partyId)
      .subscribe({
        next: (progressData: CantonPreApprovalProgress | CantonPreApprovalResult) => {
          if ("isApproved" in progressData) {
            preapprovalResult = {
              isApproved: progressData.isApproved,
            };
            this.setState({ showConfirmation: true });
          }

          if ("status" in progressData) {
            this.setState({ authorizeStatus: progressData.status });
          }
        },
        complete: () => {
          logger.log("Canton preapproval completed", preapprovalResult);

          if (!preapprovalResult || !preapprovalResult.isApproved) {
            const errorMessage = `Transaction pre-approval failed: Unknown error`;
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
      accountName: _accountName,
      isCreating: _isCreating,
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
      currency,
      device,
      selectedAccounts,
      editedNames,
      cantonBridge,
      transitionTo: this.transitionTo,
      onAddAccounts: this.handleAddAccounts,
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
      setIsProcessing: this.setIsProcessing,
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
      startOnboarding: this.handleStartOnboarding,
    };

    console.log("[OnboardModal] this.props", this.props, this.state);

    return (
      <Modal
        centered
        name="MODAL_CANTON_ONBOARD_ACCOUNT"
        onHide={this.handleReset}
        // onBeforeOpen={this.handleBeforeOpen}
        preventBackdropClick={stepId === StepId.ONBOARD}
        render={({ onClose }) => (
          <Stepper
            title={<Trans i18nKey="canton.addAccount.title">Add Canton Account</Trans>}
            stepId={stepId}
            onStepChange={this.handleStepChange}
            onClose={onClose}
            steps={this.STEPS as Step<StepId, unknown>[]}
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
