import React, { createContext, useContext, type ReactNode, useMemo } from "react";
import type {
  SendFlowState,
  SendFlowUiConfig,
  SendFlowTransactionActions,
  SendFlowOperationActions,
} from "../types";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import type { FlowStatusActions } from "../../FlowWizard/types";

/**
 * SendFlowContext
 *
 * Business logic context for the Send flow.
 * Navigation is handled separately by FlowWizard (useFlowWizard hook).
 *
 * This pattern allows clean separation:
 * - FlowWizard: navigation, steps, animations (generic)
 * - SendFlowContext: transaction state, recipient, amount (domain-specific)
 */

// Data Context
type DataContextValue = Readonly<{
  state: SendFlowState;
  uiConfig: SendFlowUiConfig;
  recipientSearch: Readonly<{
    value: string;
    setValue: (value: string) => void;
    clear: () => void;
  }>;
}>;

const SendFlowDataContext = createContext<DataContextValue | null>(null);

// Actions Context
type ActionsContextValue = Readonly<{
  transaction: SendFlowTransactionActions;
  operation: SendFlowOperationActions;
  status: FlowStatusActions;
  close: () => void;
  setAccountAndNavigate: (account: AccountLike, parentAccount?: Account) => void;
}>;

const SendFlowActionsContext = createContext<ActionsContextValue | null>(null);

// Combined business context (used by the provider)
export type SendFlowBusinessContext = DataContextValue & ActionsContextValue;

type SendFlowProviderProps = Readonly<{
  value: SendFlowBusinessContext;
  children: ReactNode;
}>;

export function SendFlowProvider({ value, children }: SendFlowProviderProps) {
  const dataValue = useMemo(
    () => ({
      state: value.state,
      uiConfig: value.uiConfig,
      recipientSearch: value.recipientSearch,
    }),
    [value.state, value.uiConfig, value.recipientSearch],
  );

  const actionsValue = useMemo(
    () => ({
      transaction: value.transaction,
      operation: value.operation,
      status: value.status,
      close: value.close,
      setAccountAndNavigate: value.setAccountAndNavigate,
    }),
    [value.transaction, value.operation, value.status, value.close, value.setAccountAndNavigate],
  );

  return (
    <SendFlowDataContext.Provider value={dataValue}>
      <SendFlowActionsContext.Provider value={actionsValue}>
        {children}
      </SendFlowActionsContext.Provider>
    </SendFlowDataContext.Provider>
  );
}

// Hooks

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
