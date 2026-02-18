import { useCallback, useMemo, useState } from "react";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import { FLOW_STATUS, type FlowStatus } from "../../wizard/types";
import { useSendFlowAccount } from "./useSendFlowAccount";
import { getSendUiConfig } from "../uiConfig";
import type {
  SendFlowState,
  SendFlowInitParams,
  RecipientData,
  SendFlowOperationActions,
  SendFlowOperationResult,
  SendFlowTransactionActions,
  SendFlowTransactionState,
} from "../types";

type UseSendFlowBusinessLogicParams = Readonly<{
  initParams?: SendFlowInitParams;

  useOperationHook: (params: {
    account: AccountLike | null;
    parentAccount: Account | null;
  }) => Readonly<{
    state: SendFlowOperationResult;
    actions: SendFlowOperationActions;
  }>;

  useTransactionHook: (params: {
    account: AccountLike | null;
    parentAccount: Account | null;
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
  setAccountAndNavigate: (account: AccountLike, parentAccount?: Account) => void;
}>;

/**
 * Core Send flow business logic - platform agnostic
 * Manages account, transaction, recipient, operation, and status state
 * Apps inject platform-specific operation hooks (e.g. Redux)
 */
export function useSendFlowBusinessLogic({
  initParams,
  useOperationHook,
  useTransactionHook,
}: UseSendFlowBusinessLogicParams): UseSendFlowBusinessLogicResult {
  const [flowStatus, setFlowStatus] = useState<FlowStatus>(FLOW_STATUS.IDLE);
  const [recipientSearchValue, setRecipientSearchValue] = useState("");
  const [recipient, setRecipient] = useState<RecipientData | null>(() => {
    if (!initParams?.recipient) return null;
    return { address: initParams.recipient };
  });

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

  const uiConfig = useMemo(
    () => getSendUiConfig(accountHook.state.currency),
    [accountHook.state.currency],
  );

  const setAccountAndNavigate = useCallback(
    (account: AccountLike, parentAccount?: Account) => {
      accountHook.setAccount(account, parentAccount);
      transactionHook.actions.setAccount(account, parentAccount);
    },
    [accountHook, transactionHook.actions],
  );

  const handleRecipientSet = useCallback(
    (newRecipient: RecipientData) => {
      setRecipient(newRecipient);
      transactionHook.actions.setRecipient(newRecipient);
    },
    [transactionHook.actions],
  );

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
      setAccountAndNavigate,
    }),
    [
      state,
      transactionActions,
      operationHook.actions,
      statusActions,
      uiConfig,
      recipientSearch,
      recipient,
      setAccountAndNavigate,
    ],
  );
}
