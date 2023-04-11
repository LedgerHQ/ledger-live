import invariant from "invariant";
import React, { useCallback, useState } from "react";
import { withTranslation, TFunction } from "react-i18next";
import { compose } from "redux";
import { connect, useDispatch } from "react-redux";
import { createStructuredSelector } from "reselect";
import { UserRefusedOnDevice } from "@ledgerhq/errors";
import { addPendingOperation } from "@ledgerhq/live-common/account/index";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { SyncSkipUnderPriority } from "@ledgerhq/live-common/bridge/react/index";
import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import { Account, Operation } from "@ledgerhq/types-live";
import { StepId } from "./types";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import logger from "~/renderer/logger";
import { updateAccountWithUpdater } from "~/renderer/actions/accounts";
import { closeModal, openModal } from "~/renderer/actions/modals";
import Track from "~/renderer/analytics/Track";
import Stepper from "~/renderer/components/Stepper";
import { getCurrentDevice } from "~/renderer/reducers/devices";
import { useSteps } from "./steps";
type OwnProps = {
  account: Account;
  stepId: StepId;
  onClose: () => void;
  onChangeStepId: (a: StepId) => void;
  validatorAddress: string;
  name: string;
};
type StateProps = {
  t: TFunction;
  device: Device | undefined | null;
  accounts: Account[];
  device: Device | undefined | null;
  closeModal: (a: string) => void;
  openModal: (a: string) => void;
};
type Props = OwnProps & StateProps;
const mapStateToProps = createStructuredSelector({
  device: getCurrentDevice,
});
const mapDispatchToProps = {
  closeModal,
  openModal,
};
function Body({
  t,
  account: accountProp,
  stepId,
  onChangeStepId,
  closeModal,
  openModal,
  device,
  name,
  validatorAddress,
}: Props) {
  const dispatch = useDispatch();
  const [optimisticOperation, setOptimisticOperation] = useState(null);
  const [transactionError, setTransactionError] = useState(null);
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
    invariant(accountProp.cosmosResources, "cosmos: account and cosmos resources required");
    const delegations = accountProp.cosmosResources.delegations || [];
    const bridge = getAccountBridge(accountProp, undefined);
    const initTx = bridge.createTransaction(accountProp);
    const newTx = {
      mode: "undelegate",
      validators: delegations
        .filter(d => d.validatorAddress === validatorAddress)
        .slice(0, 1)
        .map(({ validatorAddress, amount }) => ({
          address: validatorAddress,
          amount,
        })),
    };
    const transaction = bridge.updateTransaction(initTx, newTx);
    return {
      account: accountProp,
      transaction,
    };
  });
  const currencyName = account.currency.name.toLowerCase();
  const steps = useSteps(currencyName);
  const error = transactionError || bridgeError;
  const handleRetry = useCallback(() => {
    setTransactionError(null);
    onChangeStepId("amount");
  }, [onChangeStepId]);
  const handleStepChange = useCallback(({ id }) => onChangeStepId(id), [onChangeStepId]);
  const handleCloseModal = useCallback(() => {
    closeModal(name);
  }, [name, closeModal]);
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
    title: t("cosmos.undelegation.flow.title"),
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
    bridgePending,
  };
  return (
    <Stepper {...stepperProps}>
      <SyncSkipUnderPriority priority={100} />
      <Track onUnmount event="CloseModalUndelegation" />
    </Stepper>
  );
}
const C: React$ComponentType<OwnProps> = compose(
  connect(mapStateToProps, mapDispatchToProps),
  withTranslation(),
)(Body);
export default C;
