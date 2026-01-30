import React, { createContext, useContext, useMemo, type ReactNode } from "react";
import type {
  SendFlowState,
  SendFlowUiConfig,
  SendFlowTransactionActions,
  SendFlowOperationActions,
  SendFlowBusinessContext,
} from "@ledgerhq/live-common/flows/send/types";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import type { FlowStatusActions } from "@ledgerhq/live-common/flows/wizard/types";

type DataContextValue = Readonly<{
  state: SendFlowState;
  uiConfig: SendFlowUiConfig;
  recipientSearchValue: string;
}>;

const SendFlowDataContext = createContext<DataContextValue | null>(null);

type ActionsContextValue = Readonly<{
  transaction: SendFlowTransactionActions;
  operation: SendFlowOperationActions;
  status: FlowStatusActions;
  close: () => void;
  setAccountAndNavigate: (account: AccountLike, parentAccount?: Account) => void;
  setRecipientSearchValue: (value: string) => void;
  clearRecipientSearch: () => void;
}>;

const SendFlowActionsContext = createContext<ActionsContextValue | null>(null);

type SendFlowProviderProps = Readonly<{
  value: SendFlowBusinessContext;
  onClose: () => void;
  children: ReactNode;
}>;

export function SendFlowProvider({ value, onClose, children }: SendFlowProviderProps) {
  const dataValue = useMemo<DataContextValue>(
    () => ({
      state: value.state,
      uiConfig: value.uiConfig,
      recipientSearchValue: value.recipientSearch.value,
    }),
    [value.state, value.uiConfig, value.recipientSearch.value],
  );

  const actionsValue = useMemo<ActionsContextValue>(
    () => ({
      transaction: value.transaction,
      operation: value.operation,
      status: value.status,
      close: onClose,
      setAccountAndNavigate: value.setAccountAndNavigate,
      setRecipientSearchValue: value.recipientSearch.setValue,
      clearRecipientSearch: value.recipientSearch.clear,
    }),
    [
      value.transaction,
      value.operation,
      value.status,
      onClose,
      value.setAccountAndNavigate,
      value.recipientSearch.setValue,
      value.recipientSearch.clear,
    ],
  );

  return (
    <SendFlowDataContext.Provider value={dataValue}>
      <SendFlowActionsContext.Provider value={actionsValue}>
        {children}
      </SendFlowActionsContext.Provider>
    </SendFlowDataContext.Provider>
  );
}

export function useSendFlowData(): DataContextValue {
  const context = useContext(SendFlowDataContext);
  if (!context) {
    throw new Error("useSendFlowData must be used within a SendFlowProvider");
  }
  return context;
}

export function useSendFlowActions(): ActionsContextValue {
  const context = useContext(SendFlowActionsContext);
  if (!context) {
    throw new Error("useSendFlowActions must be used within a SendFlowProvider");
  }
  return context;
}

export function useSendFlow() {
  return {
    data: useSendFlowData(),
    actions: useSendFlowActions(),
  };
}
