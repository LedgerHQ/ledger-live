import React, { createContext, useContext, type ReactNode, useMemo } from "react";
import type {
  SendFlowContextValue,
  SendFlowNavigationActions,
  SendFlowStep,
  SendStepConfig,
  SendFlowState,
  SendFlowUiConfig,
  SendFlowTransactionActions,
  SendFlowOperationActions,
  NavigationDirection,
} from "../types";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import type { FlowStatusActions } from "../../FlowWizard/types";

// Navigation Context
type NavigationContextValue = Readonly<{
  navigation: SendFlowNavigationActions;
  currentStep: SendFlowStep;
  direction: NavigationDirection;
  currentStepConfig: SendStepConfig;
}>;

const SendFlowNavigationContext = createContext<NavigationContextValue | null>(null);

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

type SendFlowProviderProps = Readonly<{
  value: SendFlowContextValue;
  children: ReactNode;
}>;

export function SendFlowProvider({ value, children }: SendFlowProviderProps) {
  const navigationValue = useMemo(
    () => ({
      navigation: value.navigation,
      currentStep: value.currentStep,
      direction: value.direction,
      currentStepConfig: value.currentStepConfig,
    }),
    [value.navigation, value.currentStep, value.direction, value.currentStepConfig],
  );

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
    <SendFlowNavigationContext.Provider value={navigationValue}>
      <SendFlowDataContext.Provider value={dataValue}>
        <SendFlowActionsContext.Provider value={actionsValue}>
          {children}
        </SendFlowActionsContext.Provider>
      </SendFlowDataContext.Provider>
    </SendFlowNavigationContext.Provider>
  );
}

// Hooks
export function useSendFlowNavigation(): NavigationContextValue {
  const context = useContext(SendFlowNavigationContext);
  if (!context) {
    throw new Error("useSendFlowNavigation must be used within a SendFlowProvider");
  }
  return context;
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
