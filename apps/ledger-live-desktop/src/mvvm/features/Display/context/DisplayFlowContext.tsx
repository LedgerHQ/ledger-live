import React, { createContext, useContext, useMemo, type ReactNode } from "react";
import type { DisplayFlowStep } from "@ledgerhq/live-common/flows/display/types";
import { FlowWizardProvider } from "../../FlowWizard/FlowWizardContext";
import type { FlowWizardContextValue } from "../../FlowWizard/types";
import type { DisplayFlowBusinessContext, DisplayStepConfig } from "../types";

/**
 * DisplayFlowContext
 *
 * Business context for the Display POC flow.
 * Navigation lives in `FlowWizardContext` and is accessed via `useFlowWizard()`.
 */

const DisplayFlowDataContext = createContext<DisplayFlowBusinessContext | null>(null);

type DisplayFlowProviderProps = Readonly<{
  value: FlowWizardContextValue<DisplayFlowStep, DisplayFlowBusinessContext, DisplayStepConfig>;
  children: ReactNode;
}>;

export function DisplayFlowProvider({ value, children }: DisplayFlowProviderProps) {
  const dataValue = useMemo<DisplayFlowBusinessContext>(
    () => ({
      account: value.account,
      parentAccount: value.parentAccount,
      currency: value.currency,
      uiConfig: value.uiConfig,
      close: value.close,
    }),
    [value.account, value.parentAccount, value.currency, value.uiConfig, value.close],
  );

  return (
    <FlowWizardProvider value={value}>
      <DisplayFlowDataContext.Provider value={dataValue}>
        {children}
      </DisplayFlowDataContext.Provider>
    </FlowWizardProvider>
  );
}

export function useDisplayFlowData(): DisplayFlowBusinessContext {
  const context = useContext(DisplayFlowDataContext);
  if (!context) {
    throw new Error("useDisplayFlowData must be used within a DisplayFlowProvider");
  }
  return context;
}
