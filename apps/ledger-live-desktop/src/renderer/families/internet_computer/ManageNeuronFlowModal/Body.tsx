import { UserRefusedOnDevice } from "@ledgerhq/errors";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { SyncSkipUnderPriority } from "@ledgerhq/live-common/bridge/react/index";
import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { TFunction } from "i18next";
import invariant from "invariant";
import React, { useCallback, useState } from "react";
import { useTranslation, withTranslation } from "react-i18next";
import { connect, useDispatch } from "react-redux";
import { compose } from "redux";
import { createStructuredSelector } from "reselect";
import { OpenModal, openModal } from "~/renderer/actions/modals";
import logger from "~/renderer/logger";
import { St, StepId } from "./types";

import {
  ICPAccount,
  ICPTransactionType,
  InternetComputerOperation,
} from "@ledgerhq/live-common/families/internet_computer/types";
import Track from "~/renderer/analytics/Track";
import Stepper from "~/renderer/components/Stepper";
import { getCurrentDevice } from "~/renderer/reducers/devices";
import { refreshNeuronsData } from "../common";
import { useSteps } from "./steps";

export type Data = {
  account: ICPAccount;
};
type OwnProps = {
  account: ICPAccount;
  refresh: boolean;
  stepId: StepId;
  onClose: () => void;
  onChangeStepId: (a: StepId) => void;
  neuronIndex?: number;
  lastManageAction?: ICPTransactionType;
  setLastManageAction: (a: ICPTransactionType) => void;
};
type StateProps = {
  t: TFunction;
  device: Device | undefined | null;
  accounts: ICPAccount[];
  openModal: OpenModal;
};
type Props = OwnProps & StateProps;
const mapStateToProps = createStructuredSelector({
  device: getCurrentDevice,
});
const mapDispatchToProps = {
  openModal,
};

function Body({
  account: accountProp,
  refresh,
  stepId,
  lastManageAction,
  setLastManageAction,
  neuronIndex,
  onChangeStepId,
  onClose,
  openModal,
  device,
}: Props) {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const [optimisticOperation, setOptimisticOperation] = useState<InternetComputerOperation | null>(
    null,
  );
  const [transactionError, setTransactionError] = useState<Error | null>(null);
  const [signed, setSigned] = useState(false);
  const [manageNeuronIndex, setManageNeuronIndex] = useState<number>(neuronIndex ?? 0);
  const [followTopic, setFollowTopic] = useState<string>("");
  const [needsRefresh, setNeedsRefresh] = useState(false);
  const {
    account,
    transaction,
    bridgeError,
    setTransaction,
    updateTransaction,
    bridgePending,
    status,
  } = useBridgeTransaction(() => {
    invariant(accountProp, "icp: account");
    const bridge = getAccountBridge(accountProp);
    const initTx = bridge.createTransaction(accountProp);
    if (refresh) {
      initTx.type = "list_neurons";
      setLastManageAction("list_neurons");
    }
    return {
      account: accountProp,
      transaction: initTx,
    };
  });
  const steps = useSteps();
  const error = transactionError || bridgeError;
  const handleRetry = useCallback(() => {
    setTransactionError(null);
    onChangeStepId("device");
  }, [onChangeStepId]);
  const handleStepChange = useCallback(({ id }: St) => onChangeStepId(id), [onChangeStepId]);

  const handleOperationBroadcasted = useCallback(
    (optimisticOperation: InternetComputerOperation) => {
      if (!accountProp) return;
      refreshNeuronsData(dispatch, accountProp, optimisticOperation);
      setOptimisticOperation(optimisticOperation);
      setTransactionError(null);
    },
    [accountProp, dispatch],
  );
  const handleTransactionError = useCallback(
    (error: Error) => {
      if (!(error instanceof UserRefusedOnDevice)) {
        logger.critical(error);
      }
      setTransactionError(error);
      onChangeStepId("confirmation");
    },
    [onChangeStepId],
  );
  const errorSteps = [];
  if (transactionError) {
    errorSteps.push(2);
  } else if (bridgeError) {
    errorSteps.push(0);
  }
  return (
    <Stepper
      title={t("internetComputer.manageNeuronFlow.title")}
      device={device}
      account={account}
      transaction={transaction}
      signed={signed}
      stepId={stepId}
      steps={steps}
      neurons={optimisticOperation?.extra?.neurons ?? accountProp.neurons}
      errorSteps={errorSteps}
      disabledSteps={[]}
      hideBreadcrumb={!!error && ["amount"].includes(stepId)}
      onRetry={handleRetry}
      onStepChange={handleStepChange}
      onClose={onClose}
      error={error}
      status={status}
      manageNeuronIndex={manageNeuronIndex}
      setManageNeuronIndex={setManageNeuronIndex}
      needsRefresh={needsRefresh}
      setNeedsRefresh={setNeedsRefresh}
      optimisticOperation={optimisticOperation}
      openModal={openModal}
      setSigned={setSigned}
      lastManageAction={lastManageAction}
      setLastManageAction={setLastManageAction}
      onChangeTransaction={setTransaction}
      onUpdateTransaction={updateTransaction}
      onOperationBroadcasted={handleOperationBroadcasted}
      onTransactionError={handleTransactionError}
      bridgePending={bridgePending}
      followTopic={followTopic}
      setFollowTopic={setFollowTopic}
    >
      <SyncSkipUnderPriority priority={100} />
      <Track onUnmount event="CloseModalUndelegation" />
    </Stepper>
  );
}
export default compose<React.ComponentType<OwnProps>>(
  connect(mapStateToProps, mapDispatchToProps),
  withTranslation(),
)(Body);
