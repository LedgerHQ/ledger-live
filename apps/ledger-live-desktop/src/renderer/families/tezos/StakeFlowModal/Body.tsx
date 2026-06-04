import React, { useCallback, useEffect, useMemo, useState } from "react";
import { bindActionCreators } from "redux";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { Trans, useTranslation } from "react-i18next";
import invariant from "invariant";
import { UserRefusedOnDevice } from "@ledgerhq/errors";
import { Operation } from "@ledgerhq/types-live";
import { addPendingOperation, getMainAccount } from "@ledgerhq/live-common/account/index";
import { useAccountBridge } from "@ledgerhq/live-common/bridge/useAccountBridge";
import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import { SyncSkipUnderPriority } from "@ledgerhq/live-common/bridge/react/index";
import {
  isAwaitingDelegation,
  useBakers,
  useDelegation,
} from "@ledgerhq/live-common/families/tezos/react";
import { whitelist } from "@ledgerhq/live-common/families/tezos/staking";
import { TezosAccount, Transaction } from "@ledgerhq/live-common/families/tezos/types";
import logger from "~/renderer/logger";
import Track from "~/renderer/analytics/Track";
import { updateAccountWithUpdater } from "~/renderer/actions/accounts";
import { openModal } from "~/renderer/actions/modals";
import { getCurrentDevice } from "~/renderer/reducers/devices";
import Stepper from "~/renderer/components/Stepper";
import StepValidator, { StepValidatorFooter } from "./steps/StepValidator";
import StepDeviceDelegation from "./steps/StepDeviceDelegation";
import StepAmount, { StepAmountFooter } from "./steps/StepAmount";
import StepDeviceStaking from "./steps/StepDeviceStaking";
import StepConfirmation, { StepConfirmationFooter } from "./steps/StepConfirmation";
import { Step, StepId, StepProps } from "./types";

export type Data = {
  account: TezosAccount;
  parentAccount?: TezosAccount | null;
  source?: string;
  skipDelegation?: boolean;
};

type Props = {
  stepId: StepId;
  onClose: () => void;
  onChangeStepId: (a: StepId) => void;
  params: Data;
};

const fullSteps: Array<Step> = [
  {
    id: "validator",
    label: <Trans i18nKey="tezos.stake.flow.steps.validator.title" />,
    component: StepValidator,
    footer: StepValidatorFooter,
    noScroll: true,
  },
  {
    id: "device-delegation",
    label: <Trans i18nKey="tezos.stake.flow.steps.deviceDelegation.title" />,
    component: StepDeviceDelegation,
    onBack: ({ transitionTo }: StepProps) => transitionTo("validator"),
  },
  {
    id: "amount",
    label: <Trans i18nKey="tezos.stake.flow.steps.amount.title" />,
    component: StepAmount,
    footer: StepAmountFooter,
    noScroll: true,
  },
  {
    id: "device-staking",
    label: <Trans i18nKey="tezos.stake.flow.steps.deviceStaking.title" />,
    component: StepDeviceStaking,
    onBack: ({ transitionTo }: StepProps) => transitionTo("amount"),
  },
  {
    id: "confirmation",
    label: <Trans i18nKey="tezos.stake.flow.steps.confirmation.title" />,
    component: StepConfirmation,
    footer: StepConfirmationFooter,
  },
];

const stakeOnlySteps: Array<Step> = fullSteps.filter(
  s => s.id !== "validator" && s.id !== "device-delegation",
);

const Body = ({ stepId, params, onClose, onChangeStepId }: Props) => {
  invariant(
    params.account?.type === "Account",
    "MODAL_TEZOS_STAKE: a Tezos main account is required (TokenAccount not supported).",
  );

  const { t } = useTranslation();
  const dispatch = useDispatch();
  const device = useSelector(getCurrentDevice);
  const [defaultBaker] = useBakers(whitelist);
  const skipDelegation = !!params.skipDelegation;

  const bridge = useAccountBridge<Transaction>(params.account, params.parentAccount);

  const {
    transaction,
    setTransaction,
    updateTransaction,
    account,
    parentAccount,
    status,
    bridgeError,
    bridgePending,
  } = useBridgeTransaction<Transaction>(bridge, () => {
    invariant(params.account, "tezos: account required");
    const initial = bridge.createTransaction(params.account);
    const initialTx = bridge.updateTransaction(initial, {
      mode: skipDelegation ? "stake" : "delegate",
    });
    return {
      account: params.account,
      parentAccount: params.parentAccount ?? undefined,
      transaction: initialTx,
    };
  });

  const [optimisticOperation, setOptimisticOperation] = useState<Operation | null>(null);
  const [transactionError, setTransactionError] = useState<Error | null>(null);
  const [signed, setSigned] = useState(false);
  const [failedStep, setFailedStep] = useState<StepId | null>(null);

  const steps = skipDelegation ? stakeOnlySteps : fullSteps;
  // Parent seeds stepId to "validator"; skipDelegation excludes it — fall back to the first available step.
  const effectiveStepId = steps.some(s => s.id === stepId) ? stepId : steps[0].id;
  useEffect(() => {
    if (stepId !== effectiveStepId) onChangeStepId(effectiveStepId);
  }, [effectiveStepId, onChangeStepId, stepId]);

  useEffect(() => {
    if (skipDelegation || !transaction) return;
    if (transaction.mode !== "delegate" || transaction.recipient || !defaultBaker?.address) return;
    setTransaction(bridge.updateTransaction(transaction, { recipient: defaultBaker.address }));
  }, [bridge, defaultBaker, setTransaction, skipDelegation, transaction]);

  const handleOpenModal = useMemo(() => bindActionCreators(openModal, dispatch), [dispatch]);

  const handleRetry = useCallback(() => {
    setTransactionError(null);
    setOptimisticOperation(null);
    setSigned(false);
  }, []);

  const handleTransactionError = useCallback(
    (error: Error) => {
      if (!(error instanceof UserRefusedOnDevice)) {
        logger.critical(error);
      }
      setTransactionError(error);
      setFailedStep(effectiveStepId);
    },
    [effectiveStepId],
  );

  const handleOperationBroadcasted = useCallback(
    (op: Operation) => {
      if (!account) return;
      const mainAccount = getMainAccount(account, parentAccount);
      dispatch(updateAccountWithUpdater(mainAccount.id, a => addPendingOperation(a, op)));

      if (effectiveStepId === "device-delegation") {
        // StepDeviceDelegation intercepts the post-broadcast transitionTo("confirmation") and lands on "amount".
        const fresh = bridge.updateTransaction(bridge.createTransaction(account), {
          mode: "stake",
        });
        setTransaction(fresh);
        setOptimisticOperation(null);
        setSigned(false);
        setTransactionError(null);
        setFailedStep(null);
        return;
      }

      setOptimisticOperation(op);
      setTransactionError(null);
    },
    [account, bridge, dispatch, effectiveStepId, parentAccount, setTransaction],
  );

  const handleStepChange = useCallback((e: Step) => onChangeStepId(e.id), [onChangeStepId]);

  const delegation = useDelegation(account ?? params.account);
  const awaitingDelegation = isAwaitingDelegation(delegation, transaction);

  const errorSteps: number[] = [];
  if (transactionError && failedStep) {
    const idx = steps.findIndex(s => s.id === failedStep);
    if (idx >= 0) errorSteps.push(idx);
  } else if (bridgeError && !awaitingDelegation) {
    errorSteps.push(0);
  }

  const error = transactionError || (awaitingDelegation ? null : bridgeError);

  const stepperProps = {
    title: t("tezos.stake.flow.title"),
    stepId: effectiveStepId,
    steps,
    errorSteps,
    disabledSteps: [],
    hideBreadcrumb: !!error && effectiveStepId === "validator",
    device,
    account,
    parentAccount,
    transaction,
    signed,
    error,
    status,
    bridgePending,
    optimisticOperation,
    openModal: handleOpenModal,
    failedStep,
    source: params.source ?? "Account Page",
    onClose,
    onChangeTransaction: setTransaction,
    onUpdateTransaction: updateTransaction,
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
      <Track onUnmount event="CloseModalTezosStake" />
    </Stepper>
  );
};

export default Body;
