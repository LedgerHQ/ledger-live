import React, { useState, useCallback } from "react";
import { compose } from "redux";
import { connect, useDispatch } from "react-redux";
import { TFunction } from "i18next";
import { createStructuredSelector } from "reselect";
import { SyncSkipUnderPriority } from "@ledgerhq/live-common/bridge/react/index";
import Track from "~/renderer/analytics/Track";
import { UserRefusedOnDevice } from "@ledgerhq/errors";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { withTranslation, Trans } from "react-i18next";
import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import { StepId, StepProps, St } from "./types";
import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { addPendingOperation } from "@ledgerhq/live-common/account/index";
import { updateAccountWithUpdater } from "~/renderer/actions/accounts";
import { getCurrentDevice } from "~/renderer/reducers/devices";
import { OpenModal, openModal } from "~/renderer/actions/modals";
import Stepper from "~/renderer/components/Stepper";
import StepValidator, { StepValidatorFooter } from "./steps/StepValidator";
import GenericStepConnectDevice from "~/renderer/modals/Send/steps/GenericStepConnectDevice";
import StepConfirmation, { StepConfirmationFooter } from "./steps/StepConfirmation";
import logger from "~/renderer/logger";
import { Account, Operation } from "@ledgerhq/types-live";

export type Props = {
  stepId: StepId;
  onClose: () => void;
  onChangeStepId: (stepId: StepId) => void;
  params: {
    account: Account;
    source?: string;
  };
  t: TFunction;
  device: Device | null | undefined;
  openModal: OpenModal;
};

const steps: St[] = [
  {
    id: "validator",
    label: <Trans i18nKey="mina.selectValidator.stepLabels.chooseValidator" />,
    component: StepValidator,
    noScroll: false,
    footer: StepValidatorFooter,
  },
  {
    id: "connectDevice",
    label: <Trans i18nKey="mina.selectValidator.stepLabels.connectDevice" />,
    component: GenericStepConnectDevice,
    onBack: ({ transitionTo }: StepProps) => transitionTo("validator"),
  },
  {
    id: "confirmation",
    label: <Trans i18nKey="mina.selectValidator.stepLabels.confirmation" />,
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

  const { account, source = "Account Page" } = params;

  const { transaction, setTransaction, updateTransaction, status, bridgeError, bridgePending } =
    useBridgeTransaction(() => {
      const bridge = getAccountBridge(account);
      const t = bridge.createTransaction(account);

      const transaction = bridge.updateTransaction(t, {
        txType: "stake",
      });

      return {
        account,
        transaction,
      };
    });

  const handleStepChange = useCallback((e: St) => onChangeStepId(e.id), [onChangeStepId]);

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

  return (
    <Stepper
      title={<Trans i18nKey="mina.selectValidator.title" />}
      device={device}
      account={account}
      transaction={transaction}
      signed={signed}
      stepId={stepId}
      steps={steps}
      errorSteps={errorSteps}
      disabledSteps={[]}
      hideBreadcrumb={!!error && ["validator"].includes(stepId)}
      onRetry={handleRetry}
      onStepChange={handleStepChange}
      onClose={onClose}
      error={error}
      status={status}
      optimisticOperation={optimisticOperation}
      openModal={openModal}
      setSigned={setSigned}
      onChangeTransaction={setTransaction}
      onUpdateTransaction={updateTransaction}
      onOperationBroadcasted={handleOperationBroadcasted}
      onTransactionError={handleTransactionError}
      t={t}
      bridgePending={bridgePending}
      source={source}
    >
      <SyncSkipUnderPriority priority={100} />
      <Track onUnmount event="CloseModalStake" />
    </Stepper>
  );
};

const C = compose<React.ComponentType<Omit<Props, "t" | "device" | "openModal">>>(
  connect(mapStateToProps, mapDispatchToProps),
  withTranslation(),
)(Body);

export default C;
