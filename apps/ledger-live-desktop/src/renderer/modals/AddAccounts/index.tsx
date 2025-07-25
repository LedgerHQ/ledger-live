import React, { PureComponent } from "react";
import { Trans, withTranslation } from "react-i18next";
import { TFunction } from "i18next";
import { connect } from "react-redux";
import { compose } from "redux";
import { createStructuredSelector } from "reselect";
import { Account } from "@ledgerhq/types-live";
import { CryptoCurrency, CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import logger from "~/renderer/logger";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { getCurrentDevice } from "~/renderer/reducers/devices";
import { accountsSelector } from "~/renderer/reducers/accounts";
import { closeModal, openModal } from "~/renderer/actions/modals";
import Track from "~/renderer/analytics/Track";
import Stepper, { Step } from "~/renderer/components/Stepper";
import { SyncSkipUnderPriority } from "@ledgerhq/live-common/bridge/react/index";
import Modal from "~/renderer/components/Modal";
import StepChooseCurrency, { StepChooseCurrencyFooter } from "./steps/StepChooseCurrency";
import StepConnectDevice from "./steps/StepConnectDevice";
import StepImport, { StepImportFooter } from "./steps/StepImport";
import StepFinish, { StepFinishFooter } from "./steps/StepFinish";
import { blacklistedTokenIdsSelector } from "~/renderer/reducers/settings";
import { addAccountsAction } from "@ledgerhq/live-wallet/addAccounts";
import { GlobalModalData } from "../types";

export type Props = {
  // props from redux
  device: Device | undefined | null;
  existingAccounts: Account[];
  closeModal: (a: string) => void;
  addAccountsAction: typeof addAccountsAction;
  blacklistedTokenIds?: string[];
  openModal?: (modalName: keyof GlobalModalData) => void;
} & UserProps;

export type UserProps = {
  // props from user
  currency?: CryptoOrTokenCurrency | undefined | null;
  flow?: string | null;
  onClose?: () => void;
  preventSkippingCurrencySelection?: boolean | undefined | null;
  newModalName?: keyof GlobalModalData;
};

type StepId = "chooseCurrency" | "connectDevice" | "import" | "finish";
type ScanStatus = "idle" | "scanning" | "error" | "finished";
export type StepProps = {
  t: TFunction;
  transitionTo: (a: string) => void;
  currency: CryptoOrTokenCurrency | null;
  device: Device | undefined | null;
  scannedAccounts: Account[];
  existingAccounts: Account[];
  checkedAccountsIds: string[];
  scanStatus: ScanStatus;
  err: Error | undefined | null;
  onClickAdd: () => Promise<void>;
  onGoStep1: () => void;
  onCloseModal: () => void;
  resetScanState: () => void;
  setCurrency: (a?: CryptoOrTokenCurrency | null) => void;
  setScanStatus: (b: ScanStatus, a?: Error | null) => string;
  setAccountName: (b: Account, a: string) => void;
  editedNames: {
    [_: string]: string;
  };
  setScannedAccounts: (a: { scannedAccounts?: Account[]; checkedAccountsIds?: string[] }) => void;
  blacklistedTokenIds?: string[];
  flow?: string;
};
type St = Step<StepId, StepProps>;
const createSteps = (skipChooseCurrencyStep?: boolean | null): St[] => {
  // the back button is not needed when we skip "chooseCurrency" step because the back button brings user to "chooseCurrency" step
  const onBack = skipChooseCurrencyStep
    ? null
    : ({ transitionTo, resetScanState }: StepProps) => {
        resetScanState();
        transitionTo("chooseCurrency");
      };
  const steps = [
    {
      id: "chooseCurrency",
      label: <Trans i18nKey="addAccounts.breadcrumb.informations" />,
      component: StepChooseCurrency,
      footer: StepChooseCurrencyFooter,
      onBack: null,
      hideFooter: false,
      noScroll: true,
    },
    {
      id: "connectDevice",
      label: <Trans i18nKey="addAccounts.breadcrumb.connectDevice" />,
      component: StepConnectDevice,
      onBack,
      hideFooter: false,
    },
    {
      id: "import",
      label: <Trans i18nKey="addAccounts.breadcrumb.import" />,
      component: StepImport,
      footer: StepImportFooter,
      onBack,
      hideFooter: false,
    },
    {
      id: "finish",
      label: <Trans i18nKey="addAccounts.breadcrumb.finish" />,
      component: StepFinish,
      footer: StepFinishFooter,
      onBack: null,
      hideFooter: true,
    },
  ];
  if (skipChooseCurrencyStep) {
    steps.shift();
  }
  // eslint-disable-next-line @typescript-eslint/consistent-type-assertions
  return steps as St[];
};
type State = {
  stepId: StepId;
  scanStatus: ScanStatus | string;
  currency: CryptoOrTokenCurrency | null | undefined;
  scannedAccounts: Account[];
  checkedAccountsIds: string[];
  editedNames: {
    [_: string]: string;
  };
  err: Error | undefined | null;
  reset: number;
};
const mapStateToProps = createStructuredSelector({
  device: getCurrentDevice,
  existingAccounts: accountsSelector,
  blacklistedTokenIds: blacklistedTokenIdsSelector,
});
const mapDispatchToProps = {
  addAccountsAction,
  closeModal,
  openModal,
};
const INITIAL_STATE: State = {
  stepId: "chooseCurrency",
  currency: null,
  scannedAccounts: [],
  checkedAccountsIds: [],
  editedNames: {},
  err: null,
  scanStatus: "idle",
  reset: 0,
};
class AddAccounts extends PureComponent<Props, State> {
  state = INITIAL_STATE;
  STEPS = createSteps(this.props.currency && !this.props.preventSkippingCurrencySelection);
  handleClickAdd = async () => {
    const { addAccountsAction, existingAccounts } = this.props;
    const { scannedAccounts, checkedAccountsIds, editedNames } = this.state;
    addAccountsAction({
      scannedAccounts,
      existingAccounts,
      selectedIds: checkedAccountsIds,
      renamings: editedNames,
    });
  };

  handleStepChange = (step: St) =>
    this.setState({
      stepId: step.id,
    });

  handleSetCurrency = (currency: CryptoCurrency | null) =>
    this.setState({
      currency,
    });

  handleSetScanStatus = (scanStatus: ScanStatus, err: Error | undefined | null = null) => {
    if (err) {
      logger.critical(err);
    }
    this.setState({
      scanStatus,
      err,
    });
  };

  handleSetAccountName = (account: Account, name: string) => {
    this.setState(({ editedNames }) => ({
      editedNames: {
        ...editedNames,
        [account.id]: name,
      },
    }));
  };

  handleSetScannedAccounts = ({
    checkedAccountsIds,
    scannedAccounts,
  }: {
    checkedAccountsIds: string[];
    scannedAccounts: Account[];
  }) => {
    if (checkedAccountsIds) {
      this.setState({ checkedAccountsIds });
    }
    if (scannedAccounts) {
      this.setState({ scannedAccounts });
    }
  };

  handleResetScanState = () => {
    this.setState({
      scanStatus: "idle",
      err: null,
      scannedAccounts: [],
      checkedAccountsIds: [],
    });
  };

  handleBeforeOpen = ({ data }: { data: UserProps | undefined }) => {
    const { currency } = this.state;
    if (!currency) {
      if (data && data.currency) {
        this.setState({
          currency: data.currency,
        });
      }
    }
  };

  onGoStep1 = () => {
    this.setState(({ reset }) => ({
      ...INITIAL_STATE,
      reset: reset + 1,
    }));
  };

  onFlowFinished = () => {
    const { newModalName, openModal } = this.props;
    if (newModalName && openModal) {
      openModal(newModalName);
    }
  };

  render() {
    const {
      device,
      existingAccounts,
      blacklistedTokenIds,
      flow = "add account",
      preventSkippingCurrencySelection,
    } = this.props;
    const { currency, scannedAccounts, checkedAccountsIds, scanStatus, err, editedNames, reset } =
      this.state;
    let { stepId } = this.state;
    const stepperProps = {
      currency,
      device,
      existingAccounts,
      blacklistedTokenIds,
      scannedAccounts,
      checkedAccountsIds,
      scanStatus,
      err,
      onClickAdd: this.handleClickAdd,
      setScanStatus: this.handleSetScanStatus,
      setCurrency: this.handleSetCurrency,
      setScannedAccounts: this.handleSetScannedAccounts,
      resetScanState: this.handleResetScanState,
      setAccountName: this.handleSetAccountName,
      onGoStep1: this.onGoStep1,
      editedNames,
      flow,
    };
    const title = <Trans i18nKey="addAccounts.title" />;
    const errorSteps = err ? [2] : [];
    if (stepId === "chooseCurrency" && this.props.currency && !preventSkippingCurrencySelection) {
      stepId = "connectDevice";
    }
    stepperProps.currency = stepperProps.currency || this.props.currency;
    return (
      <Modal
        centered
        name="MODAL_ADD_ACCOUNTS"
        onHide={() =>
          this.setState({
            ...INITIAL_STATE,
          })
        }
        onBeforeOpen={this.handleBeforeOpen}
        preventBackdropClick={stepId === "import"}
        render={({ onClose }) => {
          const handleCloseModal = () => {
            this.props.onClose?.();
            onClose && onClose();
            this.onFlowFinished();
          };
          return (
            <Stepper
              key={reset} // THIS IS A HACK because stepper is not controllable. FIXME
              title={title}
              stepId={stepId}
              onStepChange={this.handleStepChange}
              onClose={handleCloseModal}
              onCloseModal={handleCloseModal}
              steps={this.STEPS}
              errorSteps={errorSteps}
              {...stepperProps}
            >
              <Track onUnmount event="CloseModalAddAccounts" />
              <SyncSkipUnderPriority priority={100} />
            </Stepper>
          );
        }}
      />
    );
  }
}

const m = compose(
  connect(mapStateToProps, mapDispatchToProps),
  withTranslation(),
)(AddAccounts) as React.ComponentType<UserProps>;

export default m;
