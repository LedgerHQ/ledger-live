import React, { useCallback, useState } from "react";
import invariant from "invariant";
import { Trans, useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { UserRefusedOnDevice } from "@ledgerhq/errors";
import { Operation } from "@ledgerhq/types-live";
import { useAccountBridge } from "@ledgerhq/live-common/bridge/useAccountBridge";
import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import { SyncSkipUnderPriority } from "@ledgerhq/live-common/bridge/react/index";
import { addPendingOperation } from "@ledgerhq/live-common/account/index";
import { TezosAccount, Transaction } from "@ledgerhq/live-common/families/tezos/types";
import logger from "~/renderer/logger";
import Track from "~/renderer/analytics/Track";
import { updateAccountWithUpdater } from "~/renderer/actions/accounts";
import { getCurrentDevice } from "~/renderer/reducers/devices";
import Stepper from "~/renderer/components/Stepper";
import StepAmount, { StepAmountFooter } from "./steps/StepAmount";
import StepConnectDevice from "./steps/StepConnectDevice";
import StepConfirmation, { StepConfirmationFooter } from "./steps/StepConfirmation";
import { St, StepId, StepProps } from "./types";

export type Data = {
  account: TezosAccount;
  parentAccount?: TezosAccount | null;
  source?: string;
};

type Props = {
  stepId: StepId;
  onClose: () => void;
  onChangeStepId: (a: StepId) => void;
  params: Data;
};

const steps: Array<St> = [
  {
    id: "amount",
    label: <Trans i18nKey="tezos.unstake.flow.steps.amount.title" />,
    component: StepAmount,
    noScroll: true,
    footer: StepAmountFooter,
  },
  {
    id: "device",
    label: <Trans i18nKey="tezos.unstake.flow.steps.device.title" />,
    component: StepConnectDevice,
    onBack: ({ transitionTo }: StepProps) => transitionTo("amount"),
  },
  {
    id: "confirmation",
    label: <Trans i18nKey="tezos.unstake.flow.steps.confirmation.title" />,
    component: StepConfirmation,
    footer: StepConfirmationFooter,
  },
];

const Body = ({ stepId, params, onChangeStepId, onClose }: Props) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const device = useSelector(getCurrentDevice);
  const { account, parentAccount, source = "Account Page" } = params;
  invariant(
    account && account.type === "Account" && account.currency.family === "tezos",
    "UnstakeFlowModal requires a Tezos account in modal params",
  );

  const bridge = useAccountBridge<Transaction>(account, parentAccount);

  const [optimisticOperation, setOptimisticOperation] = useState<Operation | null>(null);
  const [transactionError, setTransactionError] = useState<Error | null>(null);
  const [signed, setSigned] = useState(false);

  const { transaction, setTransaction, status, bridgeError, bridgePending } =
    useBridgeTransaction<Transaction>(bridge, () => {
      const t = bridge.createTransaction(account);
      const transaction = bridge.updateTransaction(t, { mode: "unstake" });
      return { account, parentAccount, transaction };
    });

  const handleStepChange = useCallback((e: St) => onChangeStepId(e.id), [onChangeStepId]);

  const handleRetry = useCallback(() => {
    setTransactionError(null);
    setOptimisticOperation(null);
    setSigned(false);
    onChangeStepId("amount");
  }, [onChangeStepId]);

  const handleTransactionError = useCallback((error: Error) => {
    if (!(error instanceof UserRefusedOnDevice)) {
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
    title: t("tezos.unstake.flow.title"),
    stepId,
    steps,
    device,
    account,
    parentAccount,
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
      <Track onUnmount event="CloseModalTezosUnstake" />
    </Stepper>
  );
};

export default Body;
