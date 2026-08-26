import { SyncSkipUnderPriority } from "@ledgerhq/live-common/bridge/react/index";
import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import { useAccountBridge } from "@ledgerhq/live-common/bridge/useAccountBridge";
import { applyNeuronCommand } from "@ledgerhq/live-common/families/internet_computer/neuron";
import type {
  ICPAccount,
  ICPNeuron,
  ICPTransactionType,
  InternetComputerOperation,
  Transaction,
} from "@ledgerhq/live-common/families/internet_computer/types";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import invariant from "invariant";
import React, { useCallback, useMemo, useState } from "react";
import { bindActionCreators } from "redux";
import Track from "~/renderer/analytics/Track";
import { openModal } from "~/renderer/actions/modals";
import Stepper from "~/renderer/components/Stepper";
import logger from "~/renderer/logger";
import { getCurrentDevice } from "~/renderer/reducers/devices";
import { applyNeuronOperation } from "../common";
import type { Step, StepId, StepProps } from "./types";

/**
 * Steps with no transaction in flight, where the skip that protects one is not wanted.
 *
 * The account this flow shows is a frozen payload, so a sync cannot disturb it — while the account
 * page behind very much needs one. `listNeuron` is the first step the modal opens on, which is how a
 * balance debited by a stake gets picked up: the send flow hands over through `onConfirmationHandler`
 * and so never renders its own confirmation step, the only place it would have synced from.
 */
const SYNC_SAFE_STEPS = new Set<StepId>(["listNeuron", "confirmation"]);

export type Data = {
  account: ICPAccount;
  /** Set when another flow hands control back here, e.g. a top-up that ran through the send flow. */
  neuronId?: string;
  lastAction?: ICPTransactionType;
};

type Props = {
  stepId: StepId;
  onClose: () => void;
  onChangeStepId: (stepId: StepId) => void;
  params: Data;
  /** Which flow this is: the two neuron modals differ only in their steps, title and analytics. */
  steps: Step[];
  title: string;
  trackEvent: string;
  /** Step the signing failure is attributed to, for the breadcrumb's error marker. */
  signingStepId: StepId;
};

/**
 * Shared body for both neuron modals. They run the same machinery — one bridge transaction, one
 * device signature, one optimistic operation folded back onto the account — and differ only in which
 * steps they offer, so parameterizing is cheaper than maintaining two copies that must stay in sync.
 */
const Body = ({
  stepId,
  params,
  onClose,
  onChangeStepId,
  steps,
  title,
  trackEvent,
  signingStepId,
}: Props) => {
  const dispatch = useDispatch();
  const device = useSelector(getCurrentDevice);
  const { account } = params;
  invariant(account?.type === "Account", "MODAL_ICP_LIST_NEURONS: an ICP main account is required");

  const bridge = useAccountBridge<Transaction>(account);
  const { transaction, setTransaction, updateTransaction, status, bridgeError, bridgePending } =
    useBridgeTransaction<Transaction>(bridge, () => ({
      account,
      transaction: bridge.createTransaction(account),
    }));

  const [optimisticOperation, setOptimisticOperation] = useState<InternetComputerOperation | null>(
    null,
  );
  const [transactionError, setTransactionError] = useState<Error | null>(null);
  const [signed, setSigned] = useState(false);
  const [selectedNeuronId, setSelectedNeuronId] = useState<string | null>(params.neuronId ?? null);
  const [lastAction, setLastAction] = useState<ICPTransactionType | null>(
    params.lastAction ?? null,
  );

  // What the flow has learned since it opened, if anything. `account` is the payload the modal was
  // opened with and is never re-read from the store, so a refresh performed here has to be held —
  // but as an override rather than a copy, so a modal reopened with a fresher payload still shows it.
  const [refreshed, setRefreshed] = useState<{
    neurons: readonly ICPNeuron[];
    lastUpdatedMSecs: number;
  } | null>(null);

  const neurons = refreshed?.neurons ?? account.neurons.fullNeurons;
  // Only a canister read moves this. An optimistically patched neuron is not a fresh snapshot, and
  // "Last synced" must not claim that it is.
  const lastUpdatedMSecs = refreshed?.lastUpdatedMSecs ?? account.neurons.lastUpdatedMSecs;

  const handleOpenModal = useMemo(() => bindActionCreators(openModal, dispatch), [dispatch]);

  // Success and failure are the two outcomes of one attempt, so both are discarded together —
  // otherwise the confirmation step shows an earlier success beside a new failure.
  const resetAttempt = useCallback(() => {
    setTransactionError(null);
    setOptimisticOperation(null);
    setSigned(false);
  }, []);

  const handleTransactionError = useCallback((error: Error) => {
    if (error?.name !== "UserRefusedOnDevice") logger.critical(error);
    setOptimisticOperation(null);
    setTransactionError(error);
  }, []);

  const handleOperationBroadcasted = useCallback(
    (operation: InternetComputerOperation) => {
      applyNeuronOperation(dispatch, account, operation, transaction ?? undefined);
      setOptimisticOperation(operation);
      setTransactionError(null);

      const snapshot = operation.extra.neurons;
      if (snapshot) {
        setRefreshed({ neurons: snapshot, lastUpdatedMSecs: operation.date.getTime() });
        return;
      }
      // A manage_neuron reply carries no snapshot — reading one back needs another device signature.
      // Replaying the command the canister just accepted keeps the card from still showing the state
      // the action was meant to change, and where the reply stated its own result that is used.
      if (!transaction) return;
      setRefreshed(current => {
        const base = current ?? {
          neurons: account.neurons.fullNeurons,
          lastUpdatedMSecs: account.neurons.lastUpdatedMSecs,
        };
        const outcome = operation.extra.outcome;
        const patched = applyNeuronCommand(base.neurons, transaction, {
          ...(outcome !== undefined && { outcome }),
        });
        return patched ? { ...base, neurons: patched } : current;
      });
    },
    [account, dispatch, transaction],
  );

  const handleStepChange = useCallback((step: Step) => onChangeStepId(step.id), [onChangeStepId]);

  const error = transactionError || bridgeError;
  // A signing failure marks the step that was signing; a bridge error belongs to the first step,
  // since it means the transaction never became valid in the first place.
  const failedStepIndex = () => {
    if (transactionError) return steps.findIndex(step => step.id === signingStepId);
    return bridgeError ? 0 : -1;
  };
  const errorStepIndex = failedStepIndex();
  const errorSteps = errorStepIndex < 0 ? [] : [errorStepIndex];

  const stepperProps: Omit<StepProps, "transitionTo"> & {
    title: string;
    stepId: StepId;
    steps: Step[];
    errorSteps: number[];
    disabledSteps: number[];
    hideBreadcrumb: boolean;
    onStepChange: (step: Step) => void;
  } = {
    title,
    stepId,
    steps,
    errorSteps,
    disabledSteps: [],
    hideBreadcrumb: false,
    device,
    account,
    parentAccount: null,
    transaction,
    status,
    bridgePending,
    error,
    optimisticOperation,
    signed,
    onClose,
    openModal: handleOpenModal,
    onChangeTransaction: setTransaction,
    onUpdateTransaction: updateTransaction,
    onOperationBroadcasted: handleOperationBroadcasted,
    onTransactionError: handleTransactionError,
    resetAttempt,
    onStepChange: handleStepChange,
    setSigned,
    neurons,
    lastUpdatedMSecs,
    selectedNeuronId,
    setSelectedNeuronId,
    lastAction,
    setLastAction,
  };

  if (!status) return null;

  return (
    <Stepper {...stepperProps}>
      {SYNC_SAFE_STEPS.has(stepId) ? null : <SyncSkipUnderPriority priority={100} />}
      <Track onUnmount event={trackEvent} />
    </Stepper>
  );
};

export default Body;
