import type { ConcordiumCurrencyBridge } from "@ledgerhq/coin-concordium";
import { ConcordiumPairingProgress } from "@ledgerhq/coin-concordium";
import {
  setWalletConnect,
  ConcordiumWalletConnect,
  clearWalletConnect,
} from "@ledgerhq/coin-concordium/network/walletConnect";
import { getCurrencyBridge } from "@ledgerhq/live-common/bridge/index";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { addAccountsAction } from "@ledgerhq/live-wallet/addAccounts";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { Account } from "@ledgerhq/types-live";
import { log } from "@ledgerhq/logs";
import { AccountOnboardStatus } from "@ledgerhq/coin-concordium/types";
import { TFunction } from "i18next";
import invariant from "invariant";
import React, { PureComponent } from "react";
import { Trans, withTranslation } from "react-i18next";
import { connect } from "react-redux";
import { compose } from "redux";
import { createStructuredSelector } from "reselect";
import { Subscription } from "rxjs";
import { closeModal } from "~/renderer/actions/modals";
import Modal from "~/renderer/components/Modal";
import Stepper from "~/renderer/components/Stepper";
import { getCurrentDevice } from "~/renderer/reducers/devices";
import { accountsSelector } from "~/renderer/reducers/accounts";
import ConnectDeviceScreen from "./components/ConnectDeviceScreen";
import StepCreate, { StepCreateFooter } from "./steps/StepCreate";
import StepFinish, { StepFinishFooter } from "./steps/StepFinish";
import StepOnboard, { StepOnboardFooter } from "./steps/StepOnboard";
import { OnboardingResult, StepId, StepProps } from "./types";
import { extractErrorMessage, toError } from "./utils/errorExtraction";
import {
  getCreatableAccount,
  getImportableAccounts,
  resolveCreatableAccountName,
  prepareAccountsForAdding,
  getConfirmationCode,
  shouldRetryPairing,
  handlePairingProgress,
  handleOnboardingProgress,
} from "./helpers";

const STEP_TRANSITION_TIMEOUT = 1500; // Delay before continue to next step while ID app handles the pairing

const mapStateToProps = createStructuredSelector({
  device: getCurrentDevice,
  existingAccounts: accountsSelector,
});

const mapDispatchToProps = {
  closeModal,
  addAccountsAction,
};

export type UserProps = {
  currency: CryptoCurrency | null;
  device: Device | null | undefined;
  editedNames: { [accountId: string]: string };
  selectedAccounts: Account[];
  existingAccounts: Account[];
};

export type Props = {
  t: TFunction;
  closeModal: typeof closeModal;
  addAccountsAction: typeof addAccountsAction;
} & UserProps;

type State = {
  confirmationCode?: string | null;
  error: Error | null;
  isPairing: boolean;
  isProcessing: boolean;
  lastSeenDevice: Device | null;
  onboardingResult: OnboardingResult | undefined;
  onboardingStatus: AccountOnboardStatus;
  sessionTopic?: string | null;
  stepId: StepId;
  walletConnectUri?: string | null;
};

class OnboardModal extends PureComponent<Props, State> {
  state: State = {
    confirmationCode: null,
    error: null,
    isPairing: false,
    isProcessing: false,
    lastSeenDevice: null,
    onboardingResult: undefined,
    onboardingStatus: AccountOnboardStatus.INIT,
    sessionTopic: null,
    stepId: StepId.ONBOARD,
    walletConnectUri: null,
  };

  concordiumWalletConnect: ConcordiumWalletConnect | null = null;
  concordiumBridge: ConcordiumCurrencyBridge | null = null;
  pairingSubscription: Subscription | null = null;
  onboardingSubscription: Subscription | null = null;
  stepTransitionTimeout: NodeJS.Timeout | null = null;
  pairingExpiredRetryCount = 0;
  private mounted = false;

  readonly STEPS = [
    {
      id: StepId.ONBOARD,
      label: <Trans i18nKey="families.concordium.addAccount.identity.title" />,
      component: StepOnboard,
      footer: StepOnboardFooter,
    },
    {
      id: StepId.CREATE,
      label: <Trans i18nKey="families.concordium.addAccount.create.title" />,
      component: StepCreate,
      footer: StepCreateFooter,
    },
    {
      id: StepId.FINISH,
      label: <Trans i18nKey="families.concordium.addAccount.finish.title" />,
      component: StepFinish,
      footer: StepFinishFooter,
    },
  ];

  constructor(props: Props) {
    super(props);

    if (props.currency) {
      this.concordiumBridge = getCurrencyBridge(props.currency) as ConcordiumCurrencyBridge;
    }

    if (props.device) {
      Object.assign(this.state, { lastSeenDevice: props.device });
    }
  }

  componentDidMount() {
    this.mounted = true;
    this.concordiumWalletConnect = setWalletConnect();
  }

  componentDidUpdate(prevProps: Props) {
    const { device } = this.props;
    const { device: prevDevice } = prevProps;

    if (device && device !== prevDevice) {
      this.setState({ lastSeenDevice: device });
    }

    if (!device && prevDevice) {
      this.handleDeviceDisconnection();
    }

    if (device && !prevDevice) {
      this.handleDeviceReconnection();
    }
  }

  componentWillUnmount() {
    this.mounted = false;
    this.clearStepTransitionTimeout();
    this.clearPairingSubscription();
    this.clearOnboardingSubscription();
    this.concordiumWalletConnect?.disconnectAllSessions();
    clearWalletConnect();
    this.concordiumWalletConnect = null;
  }

  transitionTo = (stepId: StepId) => this.setState({ stepId });

  clearStepTransitionTimeout = () => {
    if (!this.stepTransitionTimeout) return;

    clearTimeout(this.stepTransitionTimeout);
    this.stepTransitionTimeout = null;
  };

  setStateWithTimeout = (newState: Partial<State>) => {
    this.clearStepTransitionTimeout();

    this.stepTransitionTimeout = setTimeout(() => {
      if (this.mounted) {
        this.setState(newState as State, () => this.clearStepTransitionTimeout());
      }
    }, STEP_TRANSITION_TIMEOUT);
  };

  handleDeviceDisconnection = () => {
    this.clearStepTransitionTimeout();
    this.clearPairingSubscription();
    this.clearOnboardingSubscription();
  };

  handleDeviceReconnection = async () => {
    await this.concordiumWalletConnect?.disconnectAllSessions();

    this.setState({
      isPairing: false,
      onboardingResult: undefined,
      onboardingStatus: AccountOnboardStatus.INIT,
      sessionTopic: null,
      stepId: StepId.ONBOARD,
      walletConnectUri: null,
    });
  };

  clearPairingSubscription = () => {
    if (!this.pairingSubscription) return;
    this.pairingSubscription.unsubscribe();
    this.pairingSubscription = null;
  };

  handlePair = (isRetry = false) => {
    this.clearPairingSubscription();

    const { currency, device } = this.props;

    invariant(this.concordiumBridge, "concordiumBridge is required");
    invariant(device, "device is required");
    invariant(currency, "currency is required");

    if (!isRetry) {
      this.pairingExpiredRetryCount = 0;
    }

    this.setState({
      error: null,
      isPairing: true,
      onboardingStatus: AccountOnboardStatus.INIT,
      sessionTopic: null,
      stepId: StepId.ONBOARD,
      walletConnectUri: null,
    });

    this.pairingSubscription = this.concordiumBridge
      .pairWalletConnect(currency, device.deviceId)
      .subscribe({
        next: (data: ConcordiumPairingProgress) => {
          const stateUpdate = handlePairingProgress(data);
          if (stateUpdate) {
            this.setStateWithTimeout(stateUpdate);
          }
        },
        complete: this.clearPairingSubscription,
        error: (error: unknown) => {
          if (shouldRetryPairing(error, this.pairingExpiredRetryCount)) {
            this.pairingExpiredRetryCount++;
            log("concordium-onboarding", "pairing expired, retrying", {
              attempt: this.pairingExpiredRetryCount,
              error: extractErrorMessage(error),
            });
            this.handlePair(true);
            return;
          }

          this.concordiumWalletConnect?.disconnectAllSessions();

          this.setState({
            error: toError(error),
            isPairing: false,
            onboardingStatus: AccountOnboardStatus.ERROR,
            sessionTopic: null,
            stepId: StepId.ONBOARD,
            walletConnectUri: null,
          });
        },
      });
  };

  handleAddAccounts = () => {
    const { addAccountsAction, selectedAccounts, existingAccounts, editedNames } = this.props;
    const { onboardingResult } = this.state;

    const { accounts, renamings } = prepareAccountsForAdding({
      selectedAccounts,
      editedNames,
      onboardingResult,
    });

    addAccountsAction({
      scannedAccounts: accounts,
      selectedIds: accounts.map(account => account.id),
      renamings,
      existingAccounts,
    });

    this.setState({
      stepId: StepId.FINISH,
    });
  };

  handleComplete = () => {
    const { closeModal } = this.props;

    closeModal("MODAL_CONCORDIUM_ONBOARD_ACCOUNT");
  };

  clearOnboardingSubscription = () => {
    if (!this.onboardingSubscription) return;
    this.onboardingSubscription.unsubscribe();
    this.onboardingSubscription = null;
  };

  handleCreateAccount = () => {
    this.clearOnboardingSubscription();

    const { currency, device, selectedAccounts } = this.props;
    const creatableAccount = getCreatableAccount(selectedAccounts);

    invariant(this.concordiumBridge, "concordiumBridge is required");
    invariant(creatableAccount, "creatableAccount is required");
    invariant(device, "device is required");
    invariant(currency, "currency is required");

    const { sessionTopic } = this.state;
    if (!sessionTopic) {
      log("concordium-onboarding", "No session topic", { currency, creatableAccount });
      return;
    }

    let confirmationCode: string;
    try {
      confirmationCode = getConfirmationCode(sessionTopic);
    } catch (error) {
      this.setState({
        error: toError(error),
        isProcessing: false,
        onboardingStatus: AccountOnboardStatus.ERROR,
        sessionTopic: null,
        stepId: StepId.ONBOARD,
      });
      return;
    }

    this.setState({
      onboardingStatus: AccountOnboardStatus.PREPARE,
      isProcessing: true,
      error: null,
      confirmationCode,
      stepId: StepId.CREATE,
    });

    this.onboardingSubscription = this.concordiumBridge
      .onboardAccount(currency, device.deviceId, creatableAccount)
      .subscribe({
        next: data => {
          const stateUpdate = handleOnboardingProgress(data);
          if (stateUpdate) {
            this.setStateWithTimeout(stateUpdate);
          }
        },
        complete: this.clearOnboardingSubscription,
        error: (error: unknown) => {
          log("concordium-onboarding", "create account error", {
            error: extractErrorMessage(error),
          });

          this.setState({
            confirmationCode: null,
            error: toError(error),
            isProcessing: false,
            onboardingStatus: AccountOnboardStatus.ERROR,
            stepId: StepId.CREATE,
          });
        },
      });
  };

  render() {
    const { currency, device, editedNames, selectedAccounts, t, closeModal } = this.props;
    const {
      confirmationCode,
      error,
      isPairing,
      isProcessing,
      lastSeenDevice,
      onboardingResult,
      onboardingStatus,
      sessionTopic,
      stepId,
      walletConnectUri,
    } = this.state;

    invariant(currency, "currency is required");

    if (!device) {
      return <ConnectDeviceScreen lastSeenDevice={lastSeenDevice} />;
    }

    const importableAccounts = getImportableAccounts(selectedAccounts);
    const creatableAccount = getCreatableAccount(selectedAccounts);

    invariant(creatableAccount, "creatableAccount is required");

    const accountName = resolveCreatableAccountName(
      creatableAccount,
      currency,
      editedNames,
      importableAccounts.length,
    );

    const stepperProps: StepProps = {
      accountName,
      confirmationCode,
      creatableAccount,
      currency,
      device,
      editedNames,
      error,
      importableAccounts,
      isPairing,
      isProcessing,
      onAddAccounts: this.handleAddAccounts,
      onboardingResult,
      onboardingStatus,
      onCancel: () => closeModal("MODAL_CONCORDIUM_ONBOARD_ACCOUNT"),
      onComplete: this.handleComplete,
      onCreateAccount: this.handleCreateAccount,
      onPair: this.handlePair,
      onResendCreateAccount: this.handleCreateAccount,
      sessionTopic,
      t,
      transitionTo: this.transitionTo,
      walletConnectUri,
    };

    return (
      <Modal
        centered
        name="MODAL_CONCORDIUM_ONBOARD_ACCOUNT"
        preventBackdropClick={stepId !== StepId.FINISH}
        render={({ onClose }) => (
          <Stepper<StepId, StepProps>
            noScroll
            onClose={onClose}
            onStepChange={step => this.transitionTo(step.id)}
            stepId={stepId}
            steps={this.STEPS}
            title={<Trans i18nKey="families.concordium.addAccount.title" />}
            {...stepperProps}
          />
        )}
      />
    );
  }
}

export default compose<React.ComponentType<UserProps>>(
  connect(mapStateToProps, mapDispatchToProps),
  withTranslation(),
)(OnboardModal);
