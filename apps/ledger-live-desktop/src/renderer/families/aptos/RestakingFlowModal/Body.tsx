import invariant from "invariant";
import React, { useCallback, useState } from "react";
import { withTranslation } from "react-i18next";
import { TFunction } from "i18next";
import { compose } from "redux";
import { connect, useDispatch } from "react-redux";
import { createStructuredSelector } from "reselect";
import { UserRefusedOnDevice } from "@ledgerhq/errors";
import { addPendingOperation } from "@ledgerhq/live-common/account/index";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { SyncSkipUnderPriority } from "@ledgerhq/live-common/bridge/react/index";
import { getDelegationOpMaxAmount } from "@ledgerhq/live-common/families/aptos/staking";
import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import { St, StepId } from "./types";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import logger from "~/renderer/logger";
import { updateAccountWithUpdater } from "~/renderer/actions/accounts";
import { OpenModal, openModal } from "~/renderer/actions/modals";
import Track from "~/renderer/analytics/Track";
import Stepper from "~/renderer/components/Stepper";
import { getCurrentDevice } from "~/renderer/reducers/devices";
import { useSteps } from "./steps";
import { AptosAccount } from "@ledgerhq/live-common/families/aptos/types";
import { Account, Operation } from "@ledgerhq/types-live";

export type Data = {
  account: AptosAccount;
  validatorAddress: string;
};

type OwnProps = {
  account: AptosAccount;
  stepId: StepId;
  onClose: () => void;
  onChangeStepId: (a: StepId) => void;
  validatorAddress: string;
};

type StateProps = {
  t: TFunction;
  device: Device | undefined | null;
  accounts: Account[];
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
  t,
  account: accountProp,
  onClose,
  stepId,
  onChangeStepId,
  openModal,
  device,
  validatorAddress,
}: Props) {
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
    invariant(accountProp.aptosResources, "aptos: account and aptos resources required");

    const bridge = getAccountBridge(accountProp, undefined);
    const initTx = bridge.createTransaction(accountProp);
    const mode = "restake";
    const recipient = validatorAddress;

    const maxAmount = getDelegationOpMaxAmount(accountProp, recipient, mode);

    const newTx = {
      mode,
      recipient,
      amount: maxAmount,
      useAllAmount: true,
    };

    const transaction = bridge.updateTransaction(initTx, newTx);

    return {
      account: accountProp,
      transaction,
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
    title: t("aptos.restake.flow.title"),
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
  };

  return (
    <Stepper {...stepperProps}>
      <SyncSkipUnderPriority priority={100} />
      <Track onUnmount event="CloseModalRestaking" />
    </Stepper>
  );
}

const C = compose<React.ComponentType<OwnProps>>(
  connect(mapStateToProps, mapDispatchToProps),
  withTranslation(),
)(Body);

export default C;
