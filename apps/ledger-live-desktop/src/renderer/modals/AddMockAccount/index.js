// @flow
import React, { PureComponent } from "react";
import { Trans, withTranslation } from "react-i18next";
import type { TFunction } from "react-i18next";
import { connect } from "react-redux";
import { compose } from "redux";
import { createStructuredSelector } from "reselect";
import type { CryptoCurrency, TokenCurrency, Account } from "@ledgerhq/live-common/lib/types";
import { addAccounts } from "@ledgerhq/live-common/lib/account";
import type { Device } from "@ledgerhq/live-common/lib/hw/actions/types";
import { getCurrentDevice } from "~/renderer/reducers/devices";
import { accountsSelector } from "~/renderer/reducers/accounts";
import { replaceAccounts } from "~/renderer/actions/accounts";
import { closeModal } from "~/renderer/actions/modals";
import Track from "~/renderer/analytics/Track";
import type { Step } from "~/renderer/components/Stepper";
import { SyncSkipUnderPriority } from "@ledgerhq/live-common/lib/bridge/react";
import Modal from "~/renderer/components/Modal";
import Stepper from "~/renderer/components/Stepper";
import StepChooseCurrency, { StepChooseCurrencyFooter } from "./steps/StepChooseCurrency";
import StepFinish, { StepFinishFooter } from "./steps/StepFinish";
import { blacklistedTokenIdsSelector } from "~/renderer/reducers/settings";
import StepImport, { StepImportFooter } from "./steps/StepImport";

type Props = {
  device: ?Device,
  existingAccounts: Account[],
  closeModal: string => void,
  replaceAccounts: (Account[]) => void,
  blacklistedTokenIds?: string[],
  currency: ?CryptoCurrency | ?TokenCurrency,
  flow?: string,
  onClose?: () => void,
  preventSkippingCurrencySelection: ?Boolean,
};

type StepId = "chooseCurrency" | "import" | "finish";

export type StepProps = {
  t: TFunction,
  transitionTo: string => void,
  currency: ?CryptoCurrency | ?TokenCurrency,
  existingAccounts: Account[],
  checkedAccountsIds: string[],
  scanStatus: ScanStatus,
  err: ?Error,
  onClickAdd: () => Promise<void>,
  onGoStep1: () => void,
  onCloseModal: () => void,
  setCurrency: (?CryptoCurrency) => void,
  setAccountName: (Account, string) => void,
  editedNames: { [_: string]: string },
  blacklistedTokenIds?: string[],
  flow?: string,
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
      id: "import",
      label: "Importer",
      component: StepImport,
      footer: StepImportFooter,
      onBack: null,
      hideFooter: false,
      noScroll: true,
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
  stepId: StepId,
  currency: ?CryptoCurrency,
  scannedAccounts: Account[],
  editedNames: { [_: string]: string },
  err: ?Error,
  reset: number,
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
  accountToAdd: null,
  stepId: "chooseCurrency",
  currency: null,
  err: null,
  reset: 0,
};

class AddAccounts extends PureComponent<Props, State> {
  state = INITIAL_STATE;
  STEPS = createSteps(this.props.currency && !this.props.preventSkippingCurrencySelection);

  handleClickAdd = async () => {
    const { replaceAccounts, existingAccounts } = this.props;
    const { accountToAdd, editedNames } = this.state;

    replaceAccounts(
      addAccounts({
        scannedAccounts: [accountToAdd],
        existingAccounts,
        selectedIds: [accountToAdd.id],
        renamings: editedNames,
      }),
    );
  };

  handleStepChange = (step: St) => this.setState({ stepId: step.id });

  handleSetCurrency = (currency: ?CryptoCurrency) => this.setState({ currency });

  handleSetAccountName = (account: Account, name: string) => {
    this.setState(({ editedNames }) => ({
      editedNames: { ...editedNames, [account.id]: name },
    }));
  };

  handleSetAccountToAdd = (account: Account) => {
    this.setState({ accountToAdd: account });
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
    this.setState(({ reset }) => ({ ...INITIAL_STATE, reset: reset + 1 }));
  };

  render() {
    const {
      device,
      existingAccounts,
      flow = "add account",
      preventSkippingCurrencySelection,
    } = this.props;
    const { currency, err, editedNames, reset } = this.state;
    let { stepId } = this.state;
    const stepperProps = {
      currency,
      device,
      existingAccounts,
      err,
      onClickAdd: this.handleClickAdd,
      setCurrency: this.handleSetCurrency,
      setAccountName: this.handleSetAccountName,
      setAccountToAdd: this.handleSetAccountToAdd,
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
        name="MODAL_ADD_MOCK_ACCOUNT"
        refocusWhenChange={stepId}
        onHide={() => this.setState({ ...INITIAL_STATE })}
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
