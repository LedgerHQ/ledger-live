import React, { useCallback } from "react";
import invariant from "invariant";
import { Trans, useTranslation } from "react-i18next";
import { useSelector } from "LLD/hooks/redux";
import { useAccountBridge } from "@ledgerhq/live-common/bridge/useAccountBridge";
import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import { SyncSkipUnderPriority } from "@ledgerhq/live-common/bridge/react/index";
import { getStacksStakingPosition } from "@ledgerhq/live-common/families/stacks/react";
import { StacksAccount, Transaction } from "@ledgerhq/live-common/families/stacks/types";
import Track from "~/renderer/analytics/Track";
import { getCurrentDevice } from "~/renderer/reducers/devices";
import Stepper from "~/renderer/components/Stepper";
import { useStacksFlowState } from "../useStacksFlowState";
import StepConnectDevice from "./steps/StepConnectDevice";
import StepConfirmation, { StepConfirmationFooter } from "./steps/StepConfirmation";
import { Step, StepId } from "./types";

export type Data = {
  account: StacksAccount;
  source?: string;
};

type Props = {
  stepId: StepId;
  onClose: () => void;
  onChangeStepId: (a: StepId) => void;
  params: Data;
};

const steps: Array<Step> = [
  {
    id: "connectDevice",
    label: <Trans i18nKey="stacks.unstake.flow.steps.connectDevice.title" />,
    component: StepConnectDevice,
  },
  {
    id: "confirmation",
    label: <Trans i18nKey="stacks.unstake.flow.steps.confirmation.title" />,
    component: StepConfirmation,
    footer: StepConfirmationFooter,
  },
];

const Body = ({ stepId, params, onChangeStepId, onClose }: Props) => {
  const { t } = useTranslation();
  const device = useSelector(getCurrentDevice);
  const { account, source = "Account Page" } = params;
  invariant(
    account?.type === "Account" && account.currency.family === "stacks",
    "UnstakeFlowModal requires a Stacks account in modal params",
  );

  const bridge = useAccountBridge<Transaction>(account);

  const {
    optimisticOperation,
    transactionError,
    signed,
    setSigned,
    resetFlowState,
    handleOperationBroadcasted,
    handleTransactionError,
  } = useStacksFlowState(account);

  const { transaction, setTransaction, status, bridgeError, bridgePending } =
    useBridgeTransaction<Transaction>(bridge, () => {
      const initial = bridge.createTransaction(account);
      const initialTx = bridge.updateTransaction(initial, {
        mode: "undelegate",
        valAddress: getStacksStakingPosition(account)?.delegate,
      });
      return { account, transaction: initialTx };
    });

  const handleStepChange = useCallback((e: Step) => onChangeStepId(e.id), [onChangeStepId]);

  const handleRetry = useCallback(() => {
    resetFlowState();
    // A fresh reference re-runs prepareTransaction now, instead of waiting out
    // useBridgeTransaction's own error back-off, so a failed fee preparation is actually retried.
    if (transaction) setTransaction({ ...transaction });
    onChangeStepId("connectDevice");
  }, [resetFlowState, onChangeStepId, transaction, setTransaction]);

  const error = transactionError || bridgeError;

  const stepperProps = {
    title: t("stacks.unstake.flow.title"),
    stepId,
    steps,
    device,
    account,
    transaction,
    status,
    bridgePending,
    signed,
    optimisticOperation,
    error,
    errorSteps: [],
    disabledSteps: [],
    hideBreadcrumb: !!error,
    source,
    onClose,
    onChangeTransaction: setTransaction,
    onOperationBroadcasted: handleOperationBroadcasted,
    onTransactionError: handleTransactionError,
    onRetry: handleRetry,
    onStepChange: handleStepChange,
    setSigned,
  };

  if (!status) return null;

  return (
    <Stepper {...stepperProps}>
      <SyncSkipUnderPriority priority={100} />
      <Track onUnmount event="CloseModalStacksUnstake" />
    </Stepper>
  );
};

export default Body;
