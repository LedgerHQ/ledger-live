import React, { useState, useCallback } from "react";
import { compose } from "redux";
import { connect, useDispatch } from "react-redux";
import { Trans, withTranslation } from "react-i18next";
import { createStructuredSelector } from "reselect";
import { SyncSkipUnderPriority } from "@ledgerhq/live-common/bridge/react/index";
import { UserRefusedOnDevice } from "@ledgerhq/errors";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import { addPendingOperation } from "@ledgerhq/live-common/account/index";
import { updateAccountWithUpdater } from "~/renderer/actions/accounts";
import { getCurrentDevice } from "~/renderer/reducers/devices";
import { closeModal, openModal } from "~/renderer/actions/modals";
import Stepper from "~/renderer/components/Stepper";
import StepDelegation, { StepDelegationFooter } from "./steps/StepDelegation";
import StepAmount, { StepAmountFooter } from "./steps/StepAmount";
import GenericStepConnectDevice from "~/renderer/modals/Send/steps/GenericStepConnectDevice";
import StepConfirmation, { StepConfirmationFooter } from "./steps/StepConfirmation";
import Track from "~/renderer/analytics/Track";
import logger from "~/renderer/logger";
import { ELROND_LEDGER_VALIDATOR_ADDRESS } from "@ledgerhq/live-common/families/elrond/constants";
import { AccountBridge } from "@ledgerhq/types-live";
import { Transaction } from "@ledgerhq/live-common/generated/types";
import { Account, Operation } from "@ledgerhq/live-common/types/index";
import { DelegationType, ElrondProvider } from "~/renderer/families/elrond/types";
import { StepProps, St } from "./types";
interface OwnProps {
  stepId: StepId;
  onClose: () => void;
  onChangeStepId: (step: StepId) => void;
  params: {
    account: Account;
    parentAccount: Account | undefined | null;
    validators?: Array<ElrondProvider>;
    delegations?: Array<DelegationType>;
  };
  name: string;
}
interface StateProps {
  t: TFunction;
  device: Device | undefined | null;
  accounts: Account[];
  device: Device | undefined | null;
  closeModal: (name: string) => void;
  openModal: (name: string) => void;
}
type Props = OwnProps & StateProps;
const steps: Array<St> = [
  {
    id: "validator",
    label: <Trans i18nKey="elrond.delegation.flow.steps.validator.title" />,
    component: StepDelegation,
    noScroll: true,
    footer: StepDelegationFooter,
  },
  {
    id: "amount",
    label: <Trans i18nKey="elrond.delegation.flow.steps.amount.title" />,
    component: StepAmount,
    onBack: ({ transitionTo }: StepProps) => transitionTo("validator"),
    noScroll: true,
    footer: StepAmountFooter,
  },
  {
    id: "connectDevice",
    label: <Trans i18nKey="elrond.delegation.flow.steps.connectDevice.title" />,
    component: GenericStepConnectDevice,
    onBack: ({ transitionTo }: StepProps) => transitionTo("amount"),
  },
  {
    id: "confirmation",
    label: <Trans i18nKey="elrond.delegation.flow.steps.confirmation.title" />,
    component: StepConfirmation,
    footer: StepConfirmationFooter,
  },
];
const mapStateToProps = createStructuredSelector({
  device: getCurrentDevice,
});
const mapDispatchToProps = {
  closeModal,
  openModal,
};
const Body = (props: Props) => {
  const { t, stepId, device, closeModal, openModal, onChangeStepId, params, name } = props;
  const [optimisticOperation, setOptimisticOperation] = useState(null);
  const [transactionError, setTransactionError] = useState(null);
  const [signed, setSigned] = useState(false);
  const dispatch = useDispatch();
  const defaultValidator: ElrondProvider | undefined = params.validators.find(
    validator => validator.contract === ELROND_LEDGER_VALIDATOR_ADDRESS,
  );
  const {
    transaction,
    setTransaction,
    updateTransaction,
    account,
    parentAccount,
    status,
    bridgeError,
    bridgePending,
  } = useBridgeTransaction(() => {
    const { account } = params;
    const bridge: AccountBridge<Transaction> = getAccountBridge(account, undefined);
    const transaction: Transaction = bridge.createTransaction(account);
    return {
      account,
      parentAccount: undefined,
      transaction: bridge.updateTransaction(transaction, {
        recipient: defaultValidator ? defaultValidator.contract : "",
      }),
    };
  });
  const handleCloseModal = useCallback(() => {
    closeModal(name);
  }, [closeModal, name]);
  const handleStepChange = useCallback(e => onChangeStepId(e.id), [onChangeStepId]);
  const handleRetry = useCallback(() => {
    setTransactionError(null);
    onChangeStepId("validator");
  }, [onChangeStepId]);
  const handleTransactionError = useCallback((error: Error) => {
    if (!(error instanceof UserRefusedOnDevice)) {
      logger.critical(error);
    }
    setTransactionError(error);
  }, []);
  const handleOperationBroadcasted = useCallback(
    (optimisticOperation: Operation) => {
      if (!account) return;
      dispatch(
        updateAccountWithUpdater(account.id, account =>
          addPendingOperation(account, optimisticOperation),
        ),
      );
      setOptimisticOperation(optimisticOperation);
      setTransactionError(null);
    },
    [account, dispatch],
  );
  const error = transactionError || bridgeError;
  const errorSteps = [];
  if (transactionError) {
    errorSteps.push(2);
  } else if (bridgeError) {
    errorSteps.push(0);
  }
  const stepperProps = {
    title: t("elrond.delegation.flow.title"),
    device,
    account,
    parentAccount,
    transaction,
    signed,
    stepId,
    steps,
    errorSteps,
    disabledSteps: [],
    hideBreadcrumb: !!error && ["validator"].includes(stepId),
    onRetry: handleRetry,
    onStepChange: handleStepChange,
    onClose: handleCloseModal,
    error,
    status,
    optimisticOperation,
    openModal,
    setSigned,
    onChangeTransaction: setTransaction,
    onUpdateTransaction: updateTransaction,
    onOperationBroadcasted: handleOperationBroadcasted,
    onTransactionError: handleTransactionError,
    t,
    bridgePending,
    validators: params.validators,
    delegations: params.delegations,
  };
  return (
    <Stepper {...stepperProps}>
      <SyncSkipUnderPriority priority={100} />
      <Track onUnmount={true} event="CloseModalDelegation" />
    </Stepper>
  );
};
const C: React$ComponentType<OwnProps> = compose(
  connect(mapStateToProps, mapDispatchToProps),
  withTranslation(),
)(Body);
export default C;
