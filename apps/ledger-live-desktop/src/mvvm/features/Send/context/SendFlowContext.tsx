import React, { createContext, useContext, type ReactNode, useMemo } from "react";
import type {
  SendFlowState,
  SendFlowUiConfig,
  SendFlowTransactionActions,
  SendFlowOperationActions,
  SendFlowStep,
} from "@ledgerhq/live-common/flows/send/types";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import type { FlowStatusActions } from "@ledgerhq/live-common/flows/wizard/types";
import type { FlowWizardContextValue } from "../../FlowWizard/types";
import { FlowWizardProvider } from "../../FlowWizard/FlowWizardContext";
import { SendAmountDisplayModeProvider } from "@ledgerhq/live-common/flows/send/amount/SendAmountDisplayModeContext";
import type { SendStepConfig } from "../types";

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
  isRecipientAddressComplete: boolean;
}>;

const SendFlowDataContext = createContext<DataContextValue | null>(null);

// Actions Context
type ActionsContextValue = Readonly<{
  transaction: SendFlowTransactionActions;
  operation: SendFlowOperationActions;
  status: FlowStatusActions;
  close: () => void;
  setAccountAndNavigate: (account: AccountLike, parentAccount?: Account) => void;
  setIsRecipientAddressComplete: (value: boolean) => void;
}>;

const SendFlowActionsContext = createContext<ActionsContextValue | null>(null);

// Combined business context (used by the provider)
export type SendFlowBusinessContext = DataContextValue & ActionsContextValue;

type SendFlowProviderProps = Readonly<{
  value: FlowWizardContextValue<SendFlowStep, SendFlowBusinessContext, SendStepConfig>;
  children: ReactNode;
}>;

export function SendFlowProvider({ value, children }: SendFlowProviderProps) {
  const dataValue = useMemo(
    () => ({
      state: value.state,
      uiConfig: value.uiConfig,
      recipientSearch: value.recipientSearch,
      isRecipientAddressComplete: value.isRecipientAddressComplete,
    }),
    [value.state, value.uiConfig, value.recipientSearch, value.isRecipientAddressComplete],
  );

  const actionsValue = useMemo(
    () => ({
      transaction: value.transaction,
      operation: value.operation,
      status: value.status,
      close: value.close,
      setAccountAndNavigate: value.setAccountAndNavigate,
      setIsRecipientAddressComplete: value.setIsRecipientAddressComplete,
    }),
    [
      value.transaction,
      value.operation,
      value.status,
      value.close,
      value.setAccountAndNavigate,
      value.setIsRecipientAddressComplete,
    ],
  );

  return (
    <FlowWizardProvider value={value}>
      <SendAmountDisplayModeProvider>
        <SendFlowDataContext.Provider value={dataValue}>
          <SendFlowActionsContext.Provider value={actionsValue}>
            {children}
          </SendFlowActionsContext.Provider>
        </SendFlowDataContext.Provider>
      </SendAmountDisplayModeProvider>
    </FlowWizardProvider>
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
