import React, { createContext, useContext, useMemo, type ReactNode } from "react";
import type {
  FlowStep,
  FlowNavigationActions,
  FlowNavigationDirection,
  FlowStepConfig,
  StepRenderer,
} from "./types";

/**
 * FlowWizardContext
 *
 * Internal context for the FlowWizard navigation system.
 * This is SEPARATE from any business logic context
 *
 */

type FlowWizardContextValue<
  TStep extends FlowStep = FlowStep,
  TStepConfig extends FlowStepConfig<TStep> = FlowStepConfig<TStep>,
> = Readonly<{
  navigation: FlowNavigationActions<TStep>;
  currentStep: TStep;
  direction: FlowNavigationDirection;
  currentStepConfig: TStepConfig;
  currentStepRenderer: StepRenderer | null;
  stepHistory: readonly TStep[];
}>;

const FlowWizardContext = createContext<FlowWizardContextValue | null>(null);

type FlowWizardProviderProps<
  TStep extends FlowStep,
  TStepConfig extends FlowStepConfig<TStep>,
> = Readonly<{
  value: FlowWizardContextValue<TStep, TStepConfig>;
  children: ReactNode;
}>;

export function FlowWizardProvider<
  TStep extends FlowStep,
  TStepConfig extends FlowStepConfig<TStep>,
>({ value, children }: FlowWizardProviderProps<TStep, TStepConfig>) {
  const memoizedValue = useMemo(() => value as unknown as FlowWizardContextValue, [value]);

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
  TStepConfig extends FlowStepConfig<TStep> = FlowStepConfig<TStep>,
>(): FlowWizardContextValue<TStep, TStepConfig> {
  const context = useContext(FlowWizardContext);
  if (!context) {
    throw new Error("useFlowWizard must be used within a FlowWizardOrchestrator");
  }
  return context as unknown as FlowWizardContextValue<TStep, TStepConfig>;
}
