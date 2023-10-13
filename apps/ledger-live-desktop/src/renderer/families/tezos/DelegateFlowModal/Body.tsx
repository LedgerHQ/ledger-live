import React, { useEffect, useState, useCallback, useMemo } from "react";
import { bindActionCreators } from "redux";
import { useDispatch, useSelector } from "react-redux";
import { Trans, useTranslation } from "react-i18next";
import invariant from "invariant";
import { Account, AccountLike, Operation, SubAccount } from "@ledgerhq/types-live";
import { useBakers } from "@ledgerhq/live-common/families/tezos/bakers";
import whitelist from "@ledgerhq/live-common/families/tezos/bakers.whitelist-default";
import { getAccountBridge } from "@ledgerhq/live-common/bridge/index";
import { getMainAccount, addPendingOperation } from "@ledgerhq/live-common/account/index";
import useBridgeTransaction from "@ledgerhq/live-common/bridge/useBridgeTransaction";
import { SyncSkipUnderPriority } from "@ledgerhq/live-common/bridge/react/index";
import { UserRefusedOnDevice } from "@ledgerhq/errors";
import logger from "~/renderer/logger";
import { updateAccountWithUpdater } from "~/renderer/actions/accounts";
import Track from "~/renderer/analytics/Track";
import { getCurrentDevice } from "~/renderer/reducers/devices";
import { openModal } from "~/renderer/actions/modals";
import Stepper from "~/renderer/components/Stepper";
import StepAccount, { StepAccountFooter } from "./steps/StepAccount";
import StepStarter from "./steps/StepStarter";
import StepConnectDevice from "./steps/StepConnectDevice";
import StepSummary, { StepSummaryFooter } from "./steps/StepSummary";
import StepValidator from "./steps/StepValidator";
import StepCustom, { StepCustomFooter } from "./steps/StepCustom";
import StepConfirmation, { StepConfirmationFooter } from "./steps/StepConfirmation";
import { StepId, Step } from "./types";
import {
  TezosAccount,
  TezosOperationMode,
  Transaction,
} from "@ledgerhq/live-common/families/tezos/types";

export type Data = {
  account?: TezosAccount | SubAccount;
  parentAccount?: TezosAccount | null;
  mode?: TezosOperationMode | undefined;
  eventType?: string;
  stepId?: StepId;
  source?: string;
};

type Props = {
  stepId: StepId;
  onClose?: () => void;
  onChangeStepId: (a: StepId) => void;
  params: Data;
};

const createSteps = (params: Data): Step[] => [
  {
    id: "starter",
    component: StepStarter,
    excludeFromBreadcrumb: true,
  },
  {
    id: "account",
    label: <Trans i18nKey="delegation.flow.steps.account.label" />,
    component: StepAccount,
    footer: StepAccountFooter,
    excludeFromBreadcrumb: Boolean(params.account),
  },
  {
    id: "summary",
    label: <Trans i18nKey="delegation.flow.steps.summary.label" />,
    component: StepSummary,
    footer: StepSummaryFooter,
    onBack: params.account ? null : ({ transitionTo }) => transitionTo("account"),
  },
  {
    id: "validator",
    excludeFromBreadcrumb: true,
    component: StepValidator,
    onBack: ({ transitionTo }) => transitionTo("summary"),
  },
  {
    id: "custom",
    excludeFromBreadcrumb: true,
    component: StepCustom,
    footer: StepCustomFooter,
    // NB do not put a back here. we need to manage back ourself to reset the transaction back in initial state
  },
  {
    id: "device",
    excludeFromBreadcrumb: true,
    component: StepConnectDevice,
    onBack: ({ transitionTo }) => transitionTo("summary"),
  },
  {
    id: "confirmation",
    label: <Trans i18nKey="delegation.flow.steps.confirmation.label" />,
    component: StepConfirmation,
    footer: StepConfirmationFooter,
  },
];

const Body = ({ stepId, params, onChangeStepId, onClose }: Props) => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const device = useSelector(getCurrentDevice);
  const openedFromAccount = !!params.account;
  const [defaultBaker] = useBakers(whitelist);
  const steps = createSteps(params);

  const {
    transaction,
    setTransaction,
    account,
    parentAccount,
    setAccount,
    status,
    bridgeError,
    bridgePending,
  } = useBridgeTransaction<Transaction>(() => {
    const account = params.account;
    const parentAccount = params.parentAccount;

    return {
      parentAccount,
      account,
    };
  });

  // make sure tx is in sync
  useEffect(() => {
    if (!transaction || !account) return;
    invariant(transaction.family === "tezos", "tezos tx");

    // make sure the mode is in sync (an account changes can reset it)
    const patch: Partial<Transaction> = {
      mode: params.mode || "delegate",
    };

    // make sure that in delegate mode, a transaction recipient is set (random pick)
    if (patch.mode === "delegate" && !transaction.recipient && stepId !== "custom") {
      patch.recipient = defaultBaker.address;
    }

    // when changes, we set again
    if (patch.mode !== transaction.mode || patch.recipient) {
      setTransaction(
        getAccountBridge(account, parentAccount).updateTransaction(transaction, patch),
      );
    }
  }, [account, defaultBaker, stepId, params, parentAccount, setTransaction, transaction]);

  // make sure step id is in sync
  useEffect(() => {
    const stepId = params && params.stepId;
    if (stepId) onChangeStepId(stepId);
  }, [onChangeStepId, params]);
  const [optimisticOperation, setOptimisticOperation] = useState<Operation | null>(null);
  const [transactionError, setTransactionError] = useState<Error | null>(null);
  const [signed, setSigned] = useState(false);
  const handleOpenModal = useMemo(() => bindActionCreators(openModal, dispatch), [dispatch]);
  const handleChangeAccount = useCallback(
    (nextAccount: AccountLike, nextParentAccount?: Account | null) => {
      if (account !== nextAccount) {
        setAccount(nextAccount, nextParentAccount);
      }
    },
    [account, setAccount],
  );

  const handleRetry = useCallback(() => {
    setTransactionError(null);
    setOptimisticOperation(null);
    setSigned(false);
  }, []);

  const handleTransactionError = useCallback((error: Error) => {
    if (!(error instanceof UserRefusedOnDevice)) {
      logger.critical(error);
    }
    setTransactionError(error);
  }, []);

  const handleOperationBroadcasted = useCallback(
    (optimisticOperation: Operation) => {
      if (!account) return;
      const mainAccount = getMainAccount(account, parentAccount);
      dispatch(
        updateAccountWithUpdater(mainAccount.id, account =>
          addPendingOperation(account, optimisticOperation),
        ),
      );
      setOptimisticOperation(optimisticOperation);
      setTransactionError(null);
    },
    [account, parentAccount, dispatch],
  );

  const handleStepChange = useCallback(e => onChangeStepId(e.id), [onChangeStepId]);

  const titles = useMemo(() => {
    const titles: Record<StepId | "undelegate", string> = {
      account: t("delegation.flow.steps.account.title"),
      device: t("delegation.flow.steps.account.title"), // same as account
      starter: t("delegation.flow.steps.starter.title"),
      summary: t("delegation.flow.steps.summary.title"),
      validator: t("delegation.flow.steps.validator.title"),
      undelegate: t("delegation.flow.steps.undelegate.title"),
      confirmation: t("delegation.flow.steps.confirmation.title"),
      custom: t("delegation.flow.steps.custom.title"),
    };

    return titles;
  }, [t]);

  const title = useMemo(() => {
    return transaction && transaction.family === "tezos" && transaction.mode === "undelegate"
      ? titles.undelegate
      : (stepId ? titles[stepId] : undefined) || titles.account;
  }, [stepId, titles, transaction]);

  const errorSteps = [];
  if (transactionError) {
    errorSteps.push(2);
  } else if (bridgeError) {
    errorSteps.push(1);
  }

  const error = transactionError || bridgeError;
  const { account: accountParams, eventType, source = "Account Page" } = params || {};

  const stepperProps = {
    title,
    stepId,
    openedWithAccount: Boolean(params && accountParams),
    steps,
    eventType,
    errorSteps,
    device,
    openedFromAccount,
    account: accountParams,
    parentAccount,
    transaction,
    hideBreadcrumb:
      stepId === "starter" ||
      stepId === "validator" ||
      stepId === "custom" ||
      stepId === "confirmation",
    error,
    status,
    bridgePending,
    signed,
    optimisticOperation,
    source,
    setSigned,
    openModal: handleOpenModal,
    onClose,
    onChangeAccount: handleChangeAccount,
    onChangeTransaction: setTransaction,
    onRetry: handleRetry,
    onStepChange: handleStepChange,
    onOperationBroadcasted: handleOperationBroadcasted,
    onTransactionError: handleTransactionError,
  };

  if (!status) return null;

  return (
    <Stepper {...stepperProps}>
      <SyncSkipUnderPriority priority={100} />
      <Track onUnmount event="CloseModalDelegate" />
    </Stepper>
  );
};

export default Body;
