import invariant from "invariant";
import React, { useState, useCallback } from "react";
import { compose } from "redux";
import { connect, useDispatch } from "react-redux";
import { Trans, withTranslation, TFunction } from "react-i18next";
import { createStructuredSelector } from "reselect";
import { SyncSkipUnderPriority } from "@ledgerhq/live-common/bridge/react/index";
import Track from "~/renderer/analytics/Track";
import { UserRefusedOnDevice } from "@ledgerhq/errors";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import { StepId, StepProps, St } from "./types";
import { Account, Operation, SubAccount } from "@ledgerhq/types-live";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { addPendingOperation } from "@ledgerhq/live-common/account/index";
import { updateAccountWithUpdater } from "~/renderer/actions/accounts";
import { getCurrentDevice } from "~/renderer/reducers/devices";
import { OpenModal, openModal } from "~/renderer/actions/modals";

import Stepper from "~/renderer/components/Stepper";
import StepInfo, { StepInfoFooter } from "./steps/StepInfo";
import GenericStepConnectDevice from "~/renderer/modals/Send/steps/GenericStepConnectDevice";
import StepConfirmation, { StepConfirmationFooter } from "./steps/StepConfirmation";
import logger from "~/renderer/logger";
import { AlgorandAccount } from "@ledgerhq/live-common/families/algorand/types";

export type Data = {
  account: AlgorandAccount | SubAccount;
  parentAccount: AlgorandAccount | undefined | null;
};

type OwnProps = {
  stepId: StepId;
  onClose: () => void;
  onChangeStepId: (a: StepId) => void;
  params: Data;
};
type StateProps = {
  t: TFunction;
  accounts: Account[];
  device: Device | undefined | null;
  openModal: OpenModal;
};
type Props = OwnProps & StateProps;
const steps: Array<St> = [
  {
    id: "info",
    label: <Trans i18nKey="algorand.claimRewards.flow.steps.info.title" />,
    component: StepInfo,
    footer: StepInfoFooter,
  },
  {
    id: "connectDevice",
    label: <Trans i18nKey="algorand.claimRewards.flow.steps.connectDevice.title" />,
    component: GenericStepConnectDevice,
    onBack: ({ transitionTo }: StepProps) => transitionTo("info"),
  },
  {
    id: "confirmation",
    label: <Trans i18nKey="algorand.claimRewards.flow.steps.confirmation.title" />,
    component: StepConfirmation,
    footer: StepConfirmationFooter,
  },
];
const mapStateToProps = createStructuredSelector({
  device: getCurrentDevice,
});
const mapDispatchToProps = {
  openModal,
};
const Body = ({ t, stepId, device, onClose, openModal, onChangeStepId, params }: Props) => {
  const [optimisticOperation, setOptimisticOperation] = useState<Operation | null>(null);
  const [transactionError, setTransactionError] = useState<Error | null>(null);
  const [signed, setSigned] = useState(false);
  const dispatch = useDispatch();
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
    invariant(account, "algorand: account required");
    const bridge = getAccountBridge(account, undefined);
    const t = bridge.createTransaction(account);
    const transaction = bridge.updateTransaction(t, {
      mode: "claimReward",
    });
    return {
      account,
      parentAccount: undefined,
      transaction,
    };
  });

  const handleStepChange = useCallback(e => onChangeStepId(e.id), [onChangeStepId]);
  const handleRetry = useCallback(() => {
    setTransactionError(null);
    onChangeStepId("connectDevice");
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
    title: t("algorand.claimRewards.flow.title"),
    device,
    account,
    parentAccount,
    transaction,
    signed,
    stepId,
    steps,
    errorSteps,
    disabledSteps: [],
    hideBreadcrumb: !!error || !!warning,
    onRetry: handleRetry,
    onStepChange: handleStepChange,
    onClose,
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
  };
  return (
    <Stepper {...stepperProps}>
      <SyncSkipUnderPriority priority={100} />
      <Track onUnmount event="CloseModalClaimRewards" />
    </Stepper>
  );
};
const C = compose<React.ComponentType<OwnProps>>(
  connect(mapStateToProps, mapDispatchToProps),
  withTranslation(),
)(Body);
export default C;
