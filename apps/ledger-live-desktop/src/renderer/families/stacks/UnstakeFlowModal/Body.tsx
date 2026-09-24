import React, { useCallback, useState } from "react";
import invariant from "invariant";
import { Trans, useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { Operation } from "@ledgerhq/types-live";
import { useAccountBridge } from "@ledgerhq/live-common/bridge/useAccountBridge";
import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import { SyncSkipUnderPriority } from "@ledgerhq/live-common/bridge/react/index";
import { addPendingOperation } from "@ledgerhq/live-common/account/index";
import { getStacksStakingPosition } from "@ledgerhq/live-common/families/stacks/react";
import { StacksAccount, Transaction } from "@ledgerhq/live-common/families/stacks/types";
import logger from "~/renderer/logger";
import Track from "~/renderer/analytics/Track";
import { updateAccountWithUpdater } from "~/renderer/actions/accounts";
import { getCurrentDevice } from "~/renderer/reducers/devices";
import Stepper from "~/renderer/components/Stepper";
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
  const dispatch = useDispatch();
  const device = useSelector(getCurrentDevice);
  const { account, source = "Account Page" } = params;
  invariant(
    account?.type === "Account" && account.currency.family === "stacks",
    "UnstakeFlowModal requires a Stacks account in modal params",
  );

  const bridge = useAccountBridge<Transaction>(account);

  const [optimisticOperation, setOptimisticOperation] = useState<Operation | null>(null);
  const [transactionError, setTransactionError] = useState<Error | null>(null);
  const [signed, setSigned] = useState(false);

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
    setTransactionError(null);
    setOptimisticOperation(null);
    setSigned(false);
    onChangeStepId("connectDevice");
  }, [onChangeStepId]);

  const handleTransactionError = useCallback((error: Error) => {
    if (error?.name !== "UserRefusedOnDevice") {
      logger.critical(error);
    }
    setTransactionError(error);
  }, []);

  const handleOperationBroadcasted = useCallback(
    (op: Operation) => {
      if (!account) return;
      dispatch(updateAccountWithUpdater(account.id, a => addPendingOperation(a, op)));
      setOptimisticOperation(op);
      setTransactionError(null);
    },
    [account, dispatch],
  );

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
