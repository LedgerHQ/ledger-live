import React, { useCallback, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { Trans, useTranslation } from "react-i18next";
import invariant from "invariant";
import { Operation } from "@ledgerhq/types-live";
import { addPendingOperation } from "@ledgerhq/live-common/account/index";
import { useAccountBridge } from "@ledgerhq/live-common/bridge/useAccountBridge";
import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import { SyncSkipUnderPriority } from "@ledgerhq/live-common/bridge/react/index";
import { StacksAccount, Transaction } from "@ledgerhq/live-common/families/stacks/types";
import { fetchPoxInfo } from "@ledgerhq/live-common/families/stacks/react";
import logger from "~/renderer/logger";
import Track from "~/renderer/analytics/Track";
import { updateAccountWithUpdater } from "~/renderer/actions/accounts";
import { getCurrentDevice } from "~/renderer/reducers/devices";
import Stepper from "~/renderer/components/Stepper";
import StepValidator, { StepValidatorFooter } from "./steps/StepValidator";
import StepAmount, { StepAmountFooter } from "./steps/StepAmount";
import StepConnectDevice from "./steps/StepConnectDevice";
import StepConfirmation, { StepConfirmationFooter } from "./steps/StepConfirmation";
import { Step, StepId, StepProps } from "./types";

// Well inside pox-5's mainnet/testnet reward-cycle length (2100 / 1050 blocks, ~14 / ~7 days at
// ~10min/block) -- frequent enough to keep the connect-device wait's staleness window small, far
// too infrequent to meaningfully load the pox info endpoint.
const START_BURN_HT_REFRESH_INTERVAL_MS = 5 * 60 * 1000;

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
    id: "validator",
    label: <Trans i18nKey="stacks.stake.flow.steps.validator.title" />,
    component: StepValidator,
    footer: StepValidatorFooter,
    noScroll: true,
  },
  {
    id: "amount",
    label: <Trans i18nKey="stacks.stake.flow.steps.amount.title" />,
    component: StepAmount,
    footer: StepAmountFooter,
    noScroll: true,
  },
  {
    id: "connectDevice",
    label: <Trans i18nKey="stacks.stake.flow.steps.connectDevice.title" />,
    component: StepConnectDevice,
    onBack: ({ transitionTo }: StepProps) => transitionTo("amount"),
  },
  {
    id: "confirmation",
    label: <Trans i18nKey="stacks.stake.flow.steps.confirmation.title" />,
    component: StepConfirmation,
    footer: StepConfirmationFooter,
  },
];

const Body = ({ stepId, params, onClose, onChangeStepId }: Props) => {
  invariant(
    params.account?.type === "Account",
    "MODAL_STACKS_STAKE: a Stacks main account is required (TokenAccount not supported).",
  );

  const { t } = useTranslation();
  const dispatch = useDispatch();
  const device = useSelector(getCurrentDevice);

  const bridge = useAccountBridge<Transaction>(params.account);

  const { transaction, setTransaction, account, status, bridgeError, bridgePending } =
    useBridgeTransaction<Transaction>(bridge, () => {
      const initial = bridge.createTransaction(params.account);
      const initialTx = bridge.updateTransaction(initial, {
        mode: "delegate",
        familySpecificData: { numCycles: 1 },
      });
      return { account: params.account, transaction: initialTx };
    });

  const [optimisticOperation, setOptimisticOperation] = useState<Operation | null>(null);
  const [transactionError, setTransactionError] = useState<Error | null>(null);
  const [signed, setSigned] = useState(false);

  const handleTransactionError = useCallback((error: Error) => {
    if (error?.name !== "UserRefusedOnDevice") {
      logger.critical(error);
    }
    setTransactionError(error);
  }, []);

  const transactionRef = useRef(transaction);
  useEffect(() => {
    transactionRef.current = transaction;
  }, [transaction]);

  const clearStartBurnHt = useCallback(() => {
    const tx = transactionRef.current;
    if (tx?.familySpecificData?.startBurnHt === undefined) return;
    setTransaction(
      bridge.updateTransaction(tx, {
        familySpecificData: { ...tx.familySpecificData, startBurnHt: undefined },
      }),
    );
  }, [bridge, setTransaction]);

  // pox-5.clar derives the reward cycle from `start-burn-ht` and rejects a stake whose height
  // belongs to a past cycle, so the value is resolved against the live chain tip only once the
  // device step is entered — the user may sit on the pool and amount steps across a cycle
  // boundary. No forward buffer is needed: `stake` checks the real tip at mining time.
  const startBurnHtRequest = useRef(0);
  const resolveStartBurnHt = useCallback(() => {
    const request = ++startBurnHtRequest.current;
    const isCurrent = () => request === startBurnHtRequest.current;
    fetchPoxInfo()
      .then(poxInfo => {
        const tx = transactionRef.current;
        if (!isCurrent() || !tx) return;
        setTransaction(
          bridge.updateTransaction(tx, {
            familySpecificData: {
              ...tx.familySpecificData,
              startBurnHt: poxInfo.current_burnchain_block_height,
            },
          }),
        );
      })
      .catch((error: Error) => {
        if (isCurrent()) handleTransactionError(error);
      });
  }, [bridge, setTransaction, handleTransactionError]);

  // Mirrors StepConnectDevice's own gate: once this is true, GenericStepConnectDevice takes over
  // and its device-signing effect (hw/actions/transaction.ts) depends on `transaction` -- any
  // further mutation there tears down and restarts an in-flight sign request, which can abandon a
  // prompt the device is already showing. So a fresh transaction reference must never be produced
  // past this point.
  const isReadyForDevice =
    !bridgePending &&
    !!(transaction?.fee || transaction?.fees) &&
    transaction?.familySpecificData?.startBurnHt !== undefined;

  // Refreshed once on entry, then periodically while the user sits on this step waiting to connect
  // -- that wait can take a while, and pox-5 validates start-burn-ht against the real chain tip at
  // *mining* time (see resolveStartBurnHt above), so a value resolved long ago can belong to a
  // reward cycle that has since rolled over. The interval is a small fraction of a reward cycle
  // (~7-14 days), so this only ever narrows a rare edge case, not eliminates a routine one. Stops
  // as soon as the transaction is ready to hand to the device (isReadyForDevice), not only once
  // signed: by the time the device is actually signing, the transaction must stay frozen (see the
  // comment above); `handleRetry` resolves a fresh height again after a failed/refused attempt.
  useEffect(() => {
    if (stepId !== "connectDevice" || signed || isReadyForDevice) return;
    resolveStartBurnHt();
    const intervalId = setInterval(resolveStartBurnHt, START_BURN_HT_REFRESH_INTERVAL_MS);
    return () => {
      startBurnHtRequest.current += 1;
      clearInterval(intervalId);
    };
  }, [stepId, signed, isReadyForDevice, resolveStartBurnHt]);

  // Going back to edit the pool or the amount invalidates the height already resolved, so the
  // device step waits for a fresh one instead of reusing it.
  useEffect(() => {
    if (stepId === "validator" || stepId === "amount") clearStartBurnHt();
  }, [stepId, clearStartBurnHt]);

  const handleOperationBroadcasted = useCallback(
    (op: Operation) => {
      if (!account) return;
      dispatch(updateAccountWithUpdater(account.id, a => addPendingOperation(a, op)));
      setOptimisticOperation(op);
      setTransactionError(null);
    },
    [account, dispatch],
  );

  const handleRetry = useCallback(() => {
    setTransactionError(null);
    setOptimisticOperation(null);
    setSigned(false);
    clearStartBurnHt();
    resolveStartBurnHt();
  }, [clearStartBurnHt, resolveStartBurnHt]);

  const handleStepChange = useCallback((e: Step) => onChangeStepId(e.id), [onChangeStepId]);

  const error = transactionError || bridgeError;

  const stepperProps = {
    title: t("stacks.stake.flow.title"),
    stepId,
    steps,
    errorSteps: error ? [steps.findIndex(s => s.id === stepId)] : [],
    disabledSteps: [],
    hideBreadcrumb: !!error,
    device,
    account,
    transaction,
    signed,
    error,
    status,
    bridgePending,
    optimisticOperation,
    source: params.source ?? "Account Page",
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
      <Track onUnmount event="CloseModalStacksStake" />
    </Stepper>
  );
};

export default Body;
