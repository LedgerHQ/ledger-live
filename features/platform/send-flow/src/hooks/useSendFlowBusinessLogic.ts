import type { SendAccount, SendAccountLike } from "../registry";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { FLOW_STATUS, type FlowStatus } from "@shared/flow-wizard";
import { useSendFlowAccount } from "./useSendFlowAccount";
import { useSyncSendFlowAccount } from "./useSyncSendFlowAccount";
import { getSendUiConfig } from "../uiConfig";
import { useSendFlowPorts } from "../ports/SendFlowPortsContext";
import { canSkipRecipientStep } from "../types";
import type {
  SendFlowState,
  SendFlowInitParams,
  RecipientData,
  SendFlowOperationActions,
  SendFlowOperationResult,
  SendFlowTransactionActions,
  SendFlowTransactionState,
} from "../types";

const NO_ACCOUNTS: readonly SendAccount[] = [];

type UseSendFlowBusinessLogicParams = Readonly<{
  initParams?: SendFlowInitParams;
  /** Store accounts, used to keep the flow on the synced version of its account. */
  accounts?: readonly SendAccount[];

  useOperationHook: (params: {
    account: SendAccountLike | null;
    parentAccount: SendAccount | null;
  }) => Readonly<{
    state: SendFlowOperationResult;
    actions: SendFlowOperationActions;
  }>;

  useTransactionHook: (params: {
    account: SendAccountLike | null;
    parentAccount: SendAccount | null;
  }) => Readonly<{
    state: SendFlowTransactionState;
    actions: SendFlowTransactionActions;
  }>;
}>;

type UseSendFlowBusinessLogicResult = Readonly<{
  state: SendFlowState;
  transaction: ReturnType<UseSendFlowBusinessLogicParams["useTransactionHook"]>["actions"] & {
    setRecipient: (recipient: RecipientData) => void;
  };
  operation: SendFlowOperationActions;
  status: Readonly<{
    setStatus: (status: FlowStatus) => void;
    setError: () => void;
    setSuccess: () => void;
    resetStatus: () => void;
  }>;
  uiConfig: ReturnType<typeof getSendUiConfig>;
  recipientSearch: Readonly<{
    value: string;
    setValue: (value: string) => void;
    clear: () => void;
  }>;
  recipient: RecipientData | null;
  isRecipientAddressComplete: boolean;
  setIsRecipientAddressComplete: (value: boolean) => void;
  resetRecipient: () => void;
  setAccountAndNavigate: (account: SendAccountLike, parentAccount?: SendAccount) => void;
  source?: string;
}>;

/**
 * Core Send flow business logic - platform agnostic
 * Manages account, transaction, recipient, operation, and status state
 * Apps inject platform-specific operation hooks (e.g. Redux)
 */
export function useSendFlowBusinessLogic({
  initParams,
  accounts = NO_ACCOUNTS,
  useOperationHook,
  useTransactionHook,
}: UseSendFlowBusinessLogicParams): UseSendFlowBusinessLogicResult {
  const [flowStatus, setFlowStatus] = useState<FlowStatus>(FLOW_STATUS.IDLE);
  const [recipientSearchValue, setRecipientSearchValue] = useState(
    () => initParams?.recipient ?? "",
  );
  const [isRecipientAddressComplete, setIsRecipientAddressComplete] = useState(false);
  const [recipient, setRecipient] = useState<RecipientData | null>(null);
  const hasInitializedDirectRecipient = useRef(false);

  const accountHook = useSendFlowAccount({
    initialAccount: initParams?.account,
    initialParentAccount: initParams?.parentAccount,
  });

  const transactionHook = useTransactionHook({
    account: accountHook.state.account,
    parentAccount: accountHook.state.parentAccount,
  });

  const operationHook = useOperationHook({
    account: accountHook.state.account,
    parentAccount: accountHook.state.parentAccount,
  });

  const { sendFeatures } = useSendFlowPorts();
  const uiConfig = useMemo(
    () => getSendUiConfig(sendFeatures, accountHook.state.currency),
    [sendFeatures, accountHook.state.currency],
  );

  const setAccountAndNavigate = useCallback(
    (account: SendAccountLike, parentAccount?: SendAccount) => {
      accountHook.setAccount(account, parentAccount);
      transactionHook.actions.setAccount(account, parentAccount);
    },
    [accountHook, transactionHook.actions],
  );

  const { setAccount: setFlowAccount } = accountHook;
  const { updateAccount: updateTransactionAccount } = transactionHook.actions;
  const handleAccountRefreshed = useCallback(
    (account: SendAccountLike, parentAccount: SendAccount | null) => {
      setFlowAccount(account, parentAccount);
      updateTransactionAccount(account, parentAccount);
    },
    [setFlowAccount, updateTransactionAccount],
  );

  useSyncSendFlowAccount({
    account: accountHook.state.account,
    parentAccount: accountHook.state.parentAccount,
    accounts,
    onAccountRefreshed: handleAccountRefreshed,
  });

  const handleRecipientSet = useCallback(
    (newRecipient: RecipientData) => {
      setRecipient(newRecipient);
      transactionHook.actions.setRecipient(newRecipient);
    },
    [transactionHook.actions],
  );

  const resetRecipient = useCallback(() => {
    setRecipient(null);
    setRecipientSearchValue("");
    setIsRecipientAddressComplete(false);
    transactionHook.actions.setRecipient({ address: "" });
  }, [transactionHook.actions]);

  useEffect(() => {
    const directRecipient = canSkipRecipientStep(initParams, uiConfig)
      ? initParams?.recipient
      : undefined;

    if (
      directRecipient === undefined ||
      hasInitializedDirectRecipient.current ||
      transactionHook.state.transaction === null
    ) {
      return;
    }

    hasInitializedDirectRecipient.current = true;
    setIsRecipientAddressComplete(true);
    handleRecipientSet({ address: directRecipient });
  }, [
    handleRecipientSet,
    initParams?.recipient,
    initParams?.skipRecipientStep,
    initParams?.source,
    transactionHook.state.transaction,
    uiConfig,
  ]);

  const recipientSearch = useMemo(
    () => ({
      value: recipientSearchValue,
      setValue: setRecipientSearchValue,
      clear: () => setRecipientSearchValue(""),
    }),
    [recipientSearchValue],
  );

  const state: SendFlowState = useMemo(
    () => ({
      account: accountHook.state,
      transaction: transactionHook.state,
      recipient,
      operation: operationHook.state,
      isLoading: transactionHook.state.bridgePending,
      flowStatus,
    }),
    [accountHook.state, transactionHook.state, recipient, operationHook.state, flowStatus],
  );

  const statusActions = useMemo(
    () => ({
      setStatus: setFlowStatus,
      setError: () => setFlowStatus(FLOW_STATUS.ERROR),
      setSuccess: () => setFlowStatus(FLOW_STATUS.SUCCESS),
      resetStatus: () => setFlowStatus(FLOW_STATUS.IDLE),
    }),
    [],
  );

  const transactionActions = useMemo(
    () => ({
      ...transactionHook.actions,
      setRecipient: handleRecipientSet,
    }),
    [transactionHook.actions, handleRecipientSet],
  );

  return useMemo(
    () => ({
      state,
      transaction: transactionActions,
      operation: operationHook.actions,
      status: statusActions,
      uiConfig,
      recipientSearch,
      recipient,
      isRecipientAddressComplete,
      setIsRecipientAddressComplete,
      resetRecipient,
      setAccountAndNavigate,
      source: initParams?.source,
    }),
    [
      state,
      transactionActions,
      operationHook.actions,
      statusActions,
      uiConfig,
      recipientSearch,
      recipient,
      isRecipientAddressComplete,
      resetRecipient,
      setAccountAndNavigate,
      initParams?.source,
    ],
  );
}
