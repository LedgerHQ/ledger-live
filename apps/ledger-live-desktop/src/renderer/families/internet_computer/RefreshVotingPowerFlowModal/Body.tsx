import invariant from "invariant";
import React, { useCallback, useState } from "react";
import { withTranslation, useTranslation } from "react-i18next";
import { TFunction } from "i18next";
import { compose } from "redux";
import { connect, useDispatch } from "react-redux";
import { createStructuredSelector } from "reselect";
import { UserRefusedOnDevice } from "@ledgerhq/errors";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { SyncSkipUnderPriority } from "@ledgerhq/live-common/bridge/react/index";
import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import { StepId, St } from "./types";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import logger from "~/renderer/logger";
import { OpenModal, openModal } from "~/renderer/actions/modals";

import Track from "~/renderer/analytics/Track";
import Stepper from "~/renderer/components/Stepper";
import { getCurrentDevice } from "~/renderer/reducers/devices";
import { useSteps } from "./steps";
import {
  ICPAccount,
  ICPTransactionType,
  InternetComputerOperation,
} from "@ledgerhq/live-common/families/internet_computer/types";
import { refreshNeuronsData } from "../common";

export type Data = {
  account: ICPAccount;
};
type OwnProps = {
  account: ICPAccount;
  stepId: StepId;
  onClose: () => void;
  onChangeStepId: (a: StepId) => void;
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
function Body({ account: accountProp, stepId, onChangeStepId, onClose, openModal, device }: Props) {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const [optimisticOperation, setOptimisticOperation] = useState<InternetComputerOperation | null>(
    null,
  );
  const [transactionError, setTransactionError] = useState<Error | null>(null);
  const [lastManageAction, setLastManageAction] = useState<ICPTransactionType | undefined>(
    undefined,
  );

  const [signed, setSigned] = useState(false);
  const [manageNeuronIndex, setManageNeuronIndex] = useState<number>(0);
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
    const bridge = getAccountBridge(accountProp, undefined);
    const initTx = bridge.createTransaction(accountProp);
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
  return (
    <Stepper
      title={t("internetComputer.refreshVotingPowerFlow.title")}
      device={device}
      account={account}
      transaction={transaction}
      signed={signed}
      stepId={stepId}
      steps={steps}
      neurons={
        optimisticOperation
          ? optimisticOperation.extra.neurons ?? accountProp.neurons
          : accountProp.neurons
      }
      errorSteps={errorSteps}
      disabledSteps={[]}
      hideBreadcrumb={!!error && ["amount"].includes(stepId)}
      onRetry={handleRetry}
      onStepChange={handleStepChange}
      onClose={onClose}
      error={error}
      status={status}
      lastManageAction={lastManageAction}
      setLastManageAction={setLastManageAction}
      manageNeuronIndex={manageNeuronIndex}
      setManageNeuronIndex={setManageNeuronIndex}
      needsRefresh={needsRefresh}
      setNeedsRefresh={setNeedsRefresh}
      optimisticOperation={optimisticOperation}
      openModal={openModal}
      setSigned={setSigned}
      onChangeTransaction={setTransaction}
      onUpdateTransaction={updateTransaction}
      onOperationBroadcasted={handleOperationBroadcasted}
      onTransactionError={handleTransactionError}
      bridgePending={bridgePending}
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
