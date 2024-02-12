import React, { useCallback, useState } from "react";
import { TFunction } from "i18next";
import { withTranslation } from "react-i18next";
import { compose } from "redux";
import { connect, useDispatch } from "react-redux";
import { createStructuredSelector } from "reselect";
import { UserRefusedOnDevice } from "@ledgerhq/errors";
import { addPendingOperation } from "@ledgerhq/live-common/account/index";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { SyncSkipUnderPriority } from "@ledgerhq/live-common/bridge/react/index";
import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import logger from "~/renderer/logger";
import { updateAccountWithUpdater } from "~/renderer/actions/accounts";
import { OpenModal, openModal } from "~/renderer/actions/modals";
import Track from "~/renderer/analytics/Track";
import Stepper from "~/renderer/components/Stepper";
import { getCurrentDevice } from "~/renderer/reducers/devices";
import { useSteps } from "./steps";
import { Account, AccountBridge, Operation } from "@ledgerhq/types-live";
import {
  Transaction,
  ElrondAccount,
  ElrondProvider,
} from "@ledgerhq/live-common/families/elrond/types";
import { StepId, St } from "./types";
import { Device } from "@ledgerhq/types-devices";
import { DelegationType } from "../../../types";

export type Data = {
  account: ElrondAccount;
  contract: string;
  validators: Array<ElrondProvider>;
  amount: string;
  delegations: Array<DelegationType>;
};
interface OwnProps {
  account: ElrondAccount;
  stepId: StepId;
  onClose: () => void;
  onChangeStepId: (step: StepId) => void;
  contract: string;
  validators: Array<ElrondProvider>;
  amount: string;
  delegations: Array<DelegationType>;
}
interface StateProps {
  t: TFunction;
  device: Device | undefined | null;
  accounts: Account[];
  openModal: OpenModal;
}
type Props = OwnProps & StateProps;
const mapStateToProps = createStructuredSelector({
  device: getCurrentDevice,
});
const mapDispatchToProps = {
  openModal,
};
const Body = (props: Props) => {
  const {
    t,
    account: accountProp,
    stepId,
    onChangeStepId,
    openModal,
    device,
    contract,
    validators,
    amount,
    delegations,
    onClose,
  } = props;
  const dispatch = useDispatch();
  const [optimisticOperation, setOptimisticOperation] = useState<Operation | null>(null);
  const [transactionError, setTransactionError] = useState<Error | null>(null);
  const [signed, setSigned] = useState(false);
  const {
    account,
    transaction,
    bridgeError,
    setTransaction,
    updateTransaction,
    bridgePending,
    status,
  } = useBridgeTransaction(() => {
    const bridge: AccountBridge<Transaction> = getAccountBridge(accountProp, undefined);
    const transaction: Transaction = bridge.createTransaction(accountProp);
    return {
      account: accountProp,
      transaction: bridge.updateTransaction(transaction, {
        recipient: contract || "",
        mode: "unDelegate",
      }),
    };
  });
  const steps = useSteps();
  const error = transactionError || bridgeError;
  const handleRetry = useCallback(() => {
    setTransactionError(null);
    onChangeStepId("amount");
  }, [onChangeStepId]);
  const handleStepChange = useCallback(({ id }: St) => onChangeStepId(id), [onChangeStepId]);

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
  const handleTransactionError = useCallback((error: Error) => {
    if (!(error instanceof UserRefusedOnDevice)) {
      logger.critical(error);
    }
    setTransactionError(error);
  }, []);
  const errorSteps = [];
  if (transactionError) {
    errorSteps.push(2);
  } else if (bridgeError) {
    errorSteps.push(0);
  }
  const stepperProps = {
    title: t("elrond.undelegation.flow.title"),
    device,
    account,
    transaction,
    signed,
    stepId,
    steps,
    errorSteps,
    disabledSteps: [],
    hideBreadcrumb: !!error && ["amount"].includes(stepId),
    onRetry: handleRetry,
    onStepChange: handleStepChange,
    onClose,
    error,
    status,
    optimisticOperation,
    openModal,
    setSigned,
    onChangeTransaction: setTransaction,
    onUpdateTransaction: updateTransaction,
    onOperationBroadcasted: handleOperationBroadcasted,
    onTransactionError: handleTransactionError,
    bridgePending,
    contract,
    validators,
    amount,
    delegations,
  };
  return (
    <Stepper {...stepperProps}>
      <SyncSkipUnderPriority priority={100} />
      <Track onUnmount={true} event="CloseModalUndelegation" />
    </Stepper>
  );
};
const C = compose<React.ComponentType<OwnProps>>(
  connect(mapStateToProps, mapDispatchToProps),
  withTranslation(),
)(Body);
export default C;
