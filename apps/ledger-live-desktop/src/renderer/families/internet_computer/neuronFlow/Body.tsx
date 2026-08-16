import { SyncSkipUnderPriority } from "@ledgerhq/live-common/bridge/react/index";
import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import { useAccountBridge } from "@ledgerhq/live-common/bridge/useAccountBridge";
import type {
  ICPAccount,
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
import type { FollowTopic, Step, StepId, StepProps } from "./types";

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
  const [followTopic, setFollowTopic] = useState<FollowTopic | null>(null);

  // A signed list_neurons returns a fresher snapshot than the account carries until the next sync
  // folds it in, so prefer it while the flow is open.
  const neurons = optimisticOperation?.extra.neurons ?? account.neurons.fullNeurons;
  const lastUpdatedMSecs = optimisticOperation?.extra.neurons
    ? optimisticOperation.date.getTime()
    : account.neurons.lastUpdatedMSecs;

  const handleOpenModal = useMemo(() => bindActionCreators(openModal, dispatch), [dispatch]);

  const handleRetry = useCallback(() => {
    setTransactionError(null);
    setOptimisticOperation(null);
    setSigned(false);
  }, []);

  const handleTransactionError = useCallback((error: Error) => {
    if (error?.name !== "UserRefusedOnDevice") logger.critical(error);
    setTransactionError(error);
  }, []);

  const handleOperationBroadcasted = useCallback(
    (operation: InternetComputerOperation) => {
      applyNeuronOperation(dispatch, account, operation);
      setOptimisticOperation(operation);
      setTransactionError(null);
    },
    [account, dispatch],
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
    onRetry: handleRetry,
    onStepChange: handleStepChange,
    setSigned,
    neurons,
    lastUpdatedMSecs,
    selectedNeuronId,
    setSelectedNeuronId,
    lastAction,
    setLastAction,
    followTopic,
    setFollowTopic,
  };

  if (!status) return null;

  return (
    <Stepper {...stepperProps}>
      <SyncSkipUnderPriority priority={100} />
      <Track onUnmount event={trackEvent} />
    </Stepper>
  );
};

export default Body;
