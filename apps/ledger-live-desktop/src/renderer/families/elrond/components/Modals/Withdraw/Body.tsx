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
import Track from "~/renderer/analytics/Track";
import Stepper from "~/renderer/components/Stepper";
import StepWithdraw, { StepWithdrawFooter } from "./steps/StepWithdraw";
import GenericStepConnectDevice from "~/renderer/modals/Send/steps/GenericStepConnectDevice";
import StepConfirmation, { StepConfirmationFooter } from "./steps/StepConfirmation";
import logger from "~/renderer/logger";
import { AccountBridge, Operation } from "@ledgerhq/types-live";
import { Transaction } from "@ledgerhq/live-common/generated/types";
import { StepProps, St } from "./types";
interface OwnProps {
  stepId: StepId;
  onClose: () => void;
  onChangeStepId: (step: StepId) => void;
  params: {
    account: Account;
    parentAccount: Account | undefined | null;
    unbondings?: any;
    contract?: string;
    amount?: string;
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
    id: "withdraw",
    label: <Trans i18nKey="elrond.withdraw.flow.steps.withdraw.title" />,
    component: StepWithdraw,
    noScroll: true,
    footer: StepWithdrawFooter,
  },
  {
    id: "connectDevice",
    label: <Trans i18nKey="elrond.withdraw.flow.steps.connectDevice.title" />,
    component: GenericStepConnectDevice,
    onBack: ({ transitionTo }: StepProps) => transitionTo("claimRewards"),
  },
  {
    id: "confirmation",
    label: <Trans i18nKey="elrond.withdraw.flow.steps.confirmation.title" />,
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
  const {
    account,
    transaction,
    bridgeError,
    setTransaction,
    updateTransaction,
    bridgePending,
    status,
    parentAccount,
  } = useBridgeTransaction(() => {
    const bridge: AccountBridge<Transaction> = getAccountBridge(params.account, undefined);
    const transaction: Transaction = bridge.createTransaction(params.account);
    return {
      account: params.account,
      transaction: bridge.updateTransaction(transaction, {
        mode: "withdraw",
      }),
    };
  });
  const handleCloseModal = useCallback(() => {
    closeModal(name);
  }, [closeModal, name]);
  const handleStepChange = useCallback(e => onChangeStepId(e.id), [onChangeStepId]);
  const handleRetry = useCallback(() => {
    setTransactionError(null);
    onChangeStepId("withdraw");
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
  const error = transactionError || bridgeError || status.errors.amount;
  const warning = status.warnings ? Object.values(status.warnings)[0] : null;
  const errorSteps = [];
  if (transactionError) {
    errorSteps.push(2);
  } else if (bridgeError) {
    errorSteps.push(0);
  }
  const stepperProps = {
    title: t("elrond.withdraw.flow.title"),
    device,
    account,
    parentAccount,
    transaction,
    signed,
    stepId,
    steps,
    errorSteps,
    disabledSteps: [],
    hideBreadcrumb: (!!error || !!warning) && ["withdraw"].includes(stepId),
    onRetry: handleRetry,
    onStepChange: handleStepChange,
    onClose: handleCloseModal,
    error,
    warning,
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
    unbondings: params.unbondings,
    contract: params.contract,
    amount: params.amount,
    name: params.validator ? params.validator.identity.name : params.contract,
  };
  return (
    <Stepper {...stepperProps}>
      <SyncSkipUnderPriority priority={100} />
      <Track onUnmount={true} event="CloseModalWithdraw" />
    </Stepper>
  );
};
const C: React$ComponentType<OwnProps> = compose(
  connect(mapStateToProps, mapDispatchToProps),
  withTranslation(),
)(Body);
export default C;
