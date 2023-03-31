import React, { PureComponent } from "react";
import { Trans, withTranslation, TFunction } from "react-i18next";
import { connect } from "react-redux";
import { compose } from "redux";
import { createStructuredSelector } from "reselect";
import { Account } from "@ledgerhq/types-live";
import { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { addAccounts } from "@ledgerhq/live-common/account/index";
import logger from "~/renderer/logger";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { getCurrentDevice } from "~/renderer/reducers/devices";
import { accountsSelector } from "~/renderer/reducers/accounts";
import { replaceAccounts } from "~/renderer/actions/accounts";
import { closeModal } from "~/renderer/actions/modals";
import Track from "~/renderer/analytics/Track";
import Stepper, { Step } from "~/renderer/components/Stepper";
import { SyncSkipUnderPriority } from "@ledgerhq/live-common/bridge/react/index";
import Modal from "~/renderer/components/Modal";
import StepChooseCurrency, { StepChooseCurrencyFooter } from "./steps/StepChooseCurrency";
import StepConnectDevice from "./steps/StepConnectDevice";
import StepImport, { StepImportFooter } from "./steps/StepImport";
import StepFinish, { StepFinishFooter } from "./steps/StepFinish";
import { blacklistedTokenIdsSelector } from "~/renderer/reducers/settings";
type Props = {
  device: Device | undefined | null;
  existingAccounts: Account[];
  closeModal: (a: string) => void;
  replaceAccounts: (a: Account[]) => void;
  blacklistedTokenIds?: string[];
  currency: (CryptoCurrency | undefined | null) | (TokenCurrency | undefined | null);
  flow?: string;
  onClose?: () => void;
  preventSkippingCurrencySelection: boolean | undefined | null;
};
type StepId = "chooseCurrency" | "connectDevice" | "import" | "finish";
type ScanStatus = "idle" | "scanning" | "error" | "finished";
export type StepProps = {
  t: TFunction;
  transitionTo: (a: string) => void;
  currency: (CryptoCurrency | undefined | null) | (TokenCurrency | undefined | null);
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
  setCurrency: (a?: CryptoCurrency | null) => void;
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
const createSteps = (skipChooseCurrencyStep): St[] => {
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
  return steps;
};
type State = {
  stepId: StepId;
  scanStatus: ScanStatus | string;
  currency: CryptoCurrency | undefined | null;
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
  replaceAccounts,
  closeModal,
};
const INITIAL_STATE = {
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
    const { replaceAccounts, existingAccounts } = this.props;
    const { scannedAccounts, checkedAccountsIds, editedNames } = this.state;
    replaceAccounts(
      addAccounts({
        scannedAccounts,
        existingAccounts,
        selectedIds: checkedAccountsIds,
        renamings: editedNames,
      }),
    );
  };

  handleStepChange = (step: St) =>
    this.setState({
      stepId: step.id,
    });

  handleSetCurrency = (currency?: CryptoCurrency | null) =>
    this.setState({
      currency,
    });

  handleSetScanStatus = (scanStatus: string, err: Error | undefined | null = null) => {
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
    this.setState({
      ...(checkedAccountsIds
        ? {
            checkedAccountsIds,
          }
        : {}),
      ...(scannedAccounts
        ? {
            scannedAccounts,
          }
        : {}),
    });
  };

  handleResetScanState = () => {
    this.setState({
      scanStatus: "idle",
      err: null,
      scannedAccounts: [],
      checkedAccountsIds: [],
    });
  };

  handleBeforeOpen = ({ data }) => {
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

  render() {
    const {
      device,
      existingAccounts,
      blacklistedTokenIds,
      flow = "add account",
      preventSkippingCurrencySelection,
    } = this.props;
    const {
      currency,
      scannedAccounts,
      checkedAccountsIds,
      scanStatus,
      err,
      editedNames,
      reset,
    } = this.state;
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
        refocusWhenChange={stepId}
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
            onClose();
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
const m: React$ComponentType<{}> = compose(
  connect(mapStateToProps, mapDispatchToProps),
  withTranslation(),
)(AddAccounts);
export default m;
