import type { ConcordiumCurrencyBridge, ConcordiumOnboardResult } from "@ledgerhq/coin-concordium";
import {
  ConcordiumOnboardProgress,
  ConcordiumPairingProgress,
  ConcordiumPairingStatus,
} from "@ledgerhq/coin-concordium";
import {
  setWalletConnect,
  ConcordiumWalletConnect,
  clearWalletConnect,
} from "@ledgerhq/coin-concordium/network/walletConnect";
import { getCurrencyBridge } from "@ledgerhq/live-common/bridge/index";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { getDefaultAccountName } from "@ledgerhq/live-wallet/accountName";
import { addAccountsAction } from "@ledgerhq/live-wallet/addAccounts";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { Account, AccountOnboardStatus } from "@ledgerhq/types-live";
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

const logger = console;

const STEP_TRANSITION_TIMEOUT = 1500; // Delay before continue to next step while ID app handles the pairing

const mapStateToProps = createStructuredSelector({
  device: getCurrentDevice,
  existingAccounts: accountsSelector,
});

const mapDispatchToProps = {
  closeModal,
  addAccountsAction,
};

function getCreatableAccount(selectedAccounts: Account[]): Account | undefined {
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
  onboardingResult?: {
    completedAccount: Account;
  };
};

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

  // on previous step the onboarding account is not yet finalized
  // so editedNames use a temporary account ID
  // since only one account is onboarded at a time, we can filter out importableAccounts renamings
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
  const { selectedAccounts, editedNames, onboardingResult } = config;

  const importableAccounts = getImportableAccounts(selectedAccounts);
  const completedAccount = onboardingResult?.completedAccount;

  return prepareAccountsForNewOnboarding(importableAccounts, completedAccount, editedNames);
}

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
  error: unknown | null;
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
      this.setState(newState as State, () => this.clearStepTransitionTimeout());
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

  handlePair = () => {
    this.clearPairingSubscription();

    const { currency, device } = this.props;

    invariant(this.concordiumBridge, "concordiumBridge is required");
    invariant(device, "device is required");
    invariant(currency, "currency is required");

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
          switch (data.status) {
            case ConcordiumPairingStatus.PREPARE:
              if ("walletConnectUri" in data && data.walletConnectUri) {
                this.setStateWithTimeout({
                  onboardingStatus: AccountOnboardStatus.PREPARE,
                  walletConnectUri: data.walletConnectUri,
                });
              }
              return;

            case ConcordiumPairingStatus.SUCCESS:
              if ("sessionTopic" in data && data.sessionTopic) {
                this.setStateWithTimeout({
                  isPairing: false,
                  onboardingStatus: AccountOnboardStatus.SUCCESS,
                  sessionTopic: data.sessionTopic,
                  walletConnectUri: null,
                });
              }
              return;
          }
        },
        complete: this.clearPairingSubscription,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        error: (error: any) => {
          const errorMessage = "message" in error ? error.message : String(error);
          if (errorMessage?.toLowerCase()?.includes("expired")) {
            this.handlePair();
            return;
          }

          this.concordiumWalletConnect?.disconnectAllSessions();

          this.setState({
            error,
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
      existingAccounts,
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

  getConfirmationCode = (sessionTopic: string): string => {
    return sessionTopic.substring(0, 4).toUpperCase();
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
      logger.error("[handleCreateAccount] No session topic available");
      return;
    }

    const confirmationCode = this.getConfirmationCode(sessionTopic);

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
        next: (data: ConcordiumOnboardProgress | ConcordiumOnboardResult) => {
          if ("status" in data && data.status === AccountOnboardStatus.SIGN) {
            this.setStateWithTimeout({
              onboardingStatus: AccountOnboardStatus.SIGN,
            });
            return;
          }

          if ("status" in data && data.status === AccountOnboardStatus.SUBMIT) {
            this.setStateWithTimeout({
              onboardingStatus: AccountOnboardStatus.SUBMIT,
            });
            return;
          }

          if ("account" in data) {
            this.setStateWithTimeout({
              onboardingResult: {
                completedAccount: data.account,
              },
              onboardingStatus: AccountOnboardStatus.SUCCESS,
              isProcessing: false,
            });
          }
        },
        complete: this.clearOnboardingSubscription,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        error: (error: any) => {
          const errorMessage = "message" in error ? error.message : String(error);
          if (errorMessage?.toLowerCase()?.includes("expired")) {
            this.handleCreateAccount();
            return;
          }

          logger.error("[handleCreateAccount] Failed to create account", { error });

          this.setState({
            confirmationCode: null,
            error,
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
      error: error instanceof Error ? error : null,
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
