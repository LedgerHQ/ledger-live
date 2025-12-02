import { useCallback, useMemo, useState } from "react";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import { FLOW_STATUS } from "../../FlowWizard/types";
import { useSendFlowAccount } from "./useSendFlowAccount";
import { useSendFlowTransaction } from "./useSendFlowTransaction";
import { useSendFlowOperation } from "./useSendFlowOperation";
import { getCurrencyConfig } from "../constants";
import { getMockSendUiConfig } from "../mocks/descriptor";
import type {
  SendFlowState,
  SendFlowBusinessContext,
  SendFlowInitParams,
  RecipientData,
} from "../types";

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
  const [flowStatus, setFlowStatus] = useState(FLOW_STATUS.IDLE);

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

  const currencyConfig = useMemo(
    () => getCurrencyConfig(accountHook.currencyId ?? ""),
    [accountHook.currencyId],
  );

  const uiConfig = useMemo(
    () => getMockSendUiConfig(accountHook.state.currency),
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
      transactionHook.actions.setRecipient(recipient);
    },
    [transactionHook.actions],
  );

  const state: SendFlowState = useMemo(
    () => ({
      account: accountHook.state,
      transaction: transactionHook.state,
      recipient: null,
      operation: operationHook.state,
      isLoading: transactionHook.state.bridgePending,
      flowStatus,
    }),
    [accountHook.state, transactionHook.state, operationHook.state, flowStatus],
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
      currencyConfig,
      uiConfig,
      close: onClose,
      setAccountAndNavigate,
    }),
    [
      state,
      transactionHook.actions,
      handleRecipientSet,
      operationHook.actions,
      statusActions,
      currencyConfig,
      uiConfig,
      onClose,
      setAccountAndNavigate,
    ],
  );
}
