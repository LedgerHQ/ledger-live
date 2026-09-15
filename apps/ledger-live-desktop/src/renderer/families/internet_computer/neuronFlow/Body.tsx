import { SyncSkipUnderPriority } from "@ledgerhq/live-common/bridge/react/index";
import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import { useAccountBridge } from "@ledgerhq/live-common/bridge/useAccountBridge";
import { applyNeuronCommand } from "@ledgerhq/live-common/families/internet_computer/neuron";
import {
  NeuronsData,
  type ICPAccount,
  type ICPNeuron,
  type ICPTransactionType,
  type InternetComputerOperation,
  type Transaction,
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

/** What the flow has learned since it opened: a signed snapshot, or one an accepted command patched. */
type NeuronSnapshot = {
  neurons: readonly ICPNeuron[];
  lastUpdatedMSecs: number;
};

const withSnapshot = (account: ICPAccount, snapshot: NeuronSnapshot): ICPAccount => ({
  ...account,
  neurons: new NeuronsData([...snapshot.neurons], snapshot.lastUpdatedMSecs),
});

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
  invariant(account?.type === "Account", "internet_computer: an ICP main account is required");

  const bridge = useAccountBridge<Transaction>(account);
  const {
    transaction,
    setTransaction,
    updateTransaction,
    updateAccount,
    status,
    bridgeError,
    bridgePending,
  } = useBridgeTransaction<Transaction>(bridge, () => ({
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
  const [followeeDraft, setFolloweeDraft] = useState("");

  // What the flow has learned since it opened, if anything. `account` is the payload the modal was
  // opened with and is never re-read from the store, so a refresh performed here has to be held —
  // but as an override rather than a copy, so a modal reopened with a fresher payload still shows it.
  const [refreshed, setRefreshed] = useState<NeuronSnapshot | null>(null);

  /**
   * The one account the flow speaks for, payload plus whatever it has since learned.
   *
   * Everything downstream has to agree on the neuron set: the steps measure it, `getTransactionStatus`
   * validates against it, and `increase_stake` derives the neuron's subaccount from it. Handing the
   * bare payload to any of them means measuring one snapshot and enforcing another — the split form
   * printed a range the bridge then refused, and a top-up could not resolve the neuron it was for.
   */
  const flowAccount = useMemo(
    () => (refreshed ? withSnapshot(account, refreshed) : account),
    [account, refreshed],
  );

  const neurons = flowAccount.neurons.fullNeurons;
  // Only a canister read moves this. An optimistically patched neuron is not a fresh snapshot, and
  // "Last synced" must not claim that it is — `refreshed` carries the old value through such a patch.
  const lastUpdatedMSecs = flowAccount.neurons.lastUpdatedMSecs;

  /**
   * Takes a snapshot the flow has just learned: holds it, and hands it to the bridge.
   *
   * One act rather than two, because the bridge keeps the account it was initialised with — holding a
   * snapshot without handing it over is what left the steps measuring one neuron set while
   * `getTransactionStatus` enforced another. The account alone does not re-validate, since the status
   * effect skips while the transaction is unchanged, hence the copy; `prepareTransaction` is a no-op
   * for every type this flow builds, so it is inert beyond forcing that comparison.
   */
  const learnSnapshot = useCallback(
    (snapshot: NeuronSnapshot) => {
      setRefreshed(snapshot);
      updateAccount(withSnapshot(account, snapshot));
      updateTransaction(tx => ({ ...tx }));
    },
    [account, updateAccount, updateTransaction],
  );

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
        learnSnapshot({ neurons: snapshot, lastUpdatedMSecs: operation.date.getTime() });
        return;
      }
      // A manage_neuron reply carries no snapshot — reading one back needs another device signature.
      // Replaying the command the canister just accepted keeps the card from still showing the state
      // the action was meant to change, and where the reply stated its own result that is used.
      if (!transaction) return;
      // Read from the render rather than through a state updater: the snapshot has to be handed to
      // the bridge as well as held, and one broadcast per signature means this value is current.
      const base = refreshed ?? {
        neurons: account.neurons.fullNeurons,
        lastUpdatedMSecs: account.neurons.lastUpdatedMSecs,
      };
      const outcome = operation.extra.outcome;
      const patched = applyNeuronCommand(base.neurons, transaction, {
        ...(outcome !== undefined && { outcome }),
      });
      if (patched) learnSnapshot({ ...base, neurons: patched });
    },
    [account, dispatch, transaction, refreshed, learnSnapshot],
  );

  const handleStepChange = useCallback((step: Step) => onChangeStepId(step.id), [onChangeStepId]);

  const error = transactionError || bridgeError;
  // A signing failure marks the step that was signing; a bridge error belongs to the first step,
  // since it means the transaction never became valid in the first place. Indices address the
  // breadcrumb's own list, which drops the excluded steps — seven of them in the manage flow.
  const errorSteps = useMemo(() => {
    if (transactionError) {
      const index = steps
        .filter(step => !step.excludeFromBreadcrumb)
        .findIndex(step => step.id === signingStepId);
      return index < 0 ? [] : [index];
    }
    return bridgeError ? [0] : [];
  }, [transactionError, bridgeError, steps, signingStepId]);

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
    account: flowAccount,
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
    followeeDraft,
    setFolloweeDraft,
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
