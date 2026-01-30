import React, { createContext, useContext, useMemo, type ReactNode } from "react";
import type { FlowStep, FlowStepConfig } from "@ledgerhq/live-common/flows/wizard/types";
import type { FlowWizardContextValue } from "./types";

/**
 * FlowWizardContext
 *
 * Internal context for the FlowWizard navigation system.
 * This is SEPARATE from any business logic context
 *
 */

const FlowWizardContext = createContext<FlowWizardContextValue<
  FlowStep,
  unknown,
  FlowStepConfig
> | null>(null);

type FlowWizardProviderProps<
  TStep extends FlowStep,
  TContextValue,
  TStepConfig extends FlowStepConfig<TStep>,
> = Readonly<{
  value: FlowWizardContextValue<TStep, TContextValue, TStepConfig>;
  children: ReactNode;
}>;

export function FlowWizardProvider<
  TStep extends FlowStep,
  TContextValue,
  TStepConfig extends FlowStepConfig<TStep>,
>({ value, children }: FlowWizardProviderProps<TStep, TContextValue, TStepConfig>) {
  const memoizedValue = useMemo(
    () => value as unknown as FlowWizardContextValue<FlowStep, unknown, FlowStepConfig>,
    [value],
  );

  return <FlowWizardContext.Provider value={memoizedValue}>{children}</FlowWizardContext.Provider>;
}

/**
 * useFlowWizard
 *
 * Generic hook to access FlowWizard navigation from any step component.
 *
 * @example
 * const { navigation, currentStep } = useFlowWizard<SendFlowStep>();
 * navigation.goToNextStep();
 */
export function useFlowWizard<
  TStep extends FlowStep = FlowStep,
  TContextValue = unknown,
  TStepConfig extends FlowStepConfig<TStep> = FlowStepConfig<TStep>,
>(): FlowWizardContextValue<TStep, TContextValue, TStepConfig> {
  const context = useContext(FlowWizardContext);
  if (!context) {
    throw new Error("useFlowWizard must be used within a FlowWizardOrchestrator");
  }
  return context as unknown as FlowWizardContextValue<TStep, TContextValue, TStepConfig>;
}
