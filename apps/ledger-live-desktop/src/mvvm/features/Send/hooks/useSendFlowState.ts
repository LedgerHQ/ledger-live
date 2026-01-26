import { useCallback, useMemo, useState } from "react";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import { FLOW_STATUS, type FlowStatus } from "@ledgerhq/live-common/flows/wizard/types";
import { useSendFlowAccount } from "@ledgerhq/live-common/flows/send/useSendFlowAccount";
import { useSendFlowTransaction } from "./useSendFlowTransaction";
import { useSendFlowOperation } from "./useSendFlowOperation";
import { getSendUiConfig } from "@ledgerhq/live-common/flows/send/uiConfig";
import type {
  SendFlowState,
  SendFlowBusinessContext,
  SendFlowInitParams,
  RecipientData,
} from "@ledgerhq/live-common/flows/send/types";

type UseSendFlowBusinessLogicParams = Readonly<{
  initParams?: SendFlowInitParams;
  onClose: () => void;
}>;

// Send-specific business state (account, transaction, operation, status)
// and exposes stable, typed actions to the UI
export function useSendFlowBusinessLogic({
  initParams,
  onClose,
}: UseSendFlowBusinessLogicParams): SendFlowBusinessContext {
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

  const transactionHook = useSendFlowTransaction({
    account: accountHook.state.account,
    parentAccount: accountHook.state.parentAccount,
  });

  const operationHook = useSendFlowOperation({
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
    (recipient: RecipientData) => {
      setRecipient(recipient);
      transactionHook.actions.setRecipient(recipient);
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

  return useMemo(
    () => ({
      state,
      transaction: {
        setTransaction: transactionHook.actions.setTransaction,
        updateTransaction: transactionHook.actions.updateTransaction,
        setRecipient: handleRecipientSet,
        setAccount: transactionHook.actions.setAccount,
      },
      operation: operationHook.actions,
      status: statusActions,
      uiConfig,
      recipientSearch,
      close: onClose,
      setAccountAndNavigate,
    }),
    [
      state,
      transactionHook.actions,
      handleRecipientSet,
      operationHook.actions,
      statusActions,
      uiConfig,
      recipientSearch,
      onClose,
      setAccountAndNavigate,
    ],
  );
}
