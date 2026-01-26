import React, { useMemo, type ComponentType, type ReactNode } from "react";
import type {
  FlowStep,
  FlowConfig,
  StepRegistry,
  FlowWizardContextValue,
  FlowStepConfig,
} from "@ledgerhq/live-common/flows/wizard/types";
import { useFlowWizardOrchestrator } from "./hooks/useFlowWizardNavigation";

type FlowWizardOrchestratorProps<
  TStep extends FlowStep,
  TContextValue,
  TStepConfig extends FlowStepConfig<TStep> = FlowStepConfig<TStep>,
> = Readonly<{
  flowConfig: FlowConfig<TStep, TStepConfig>;
  stepRegistry: StepRegistry<TStep>;
  contextValue: TContextValue;
  ContextProvider: ComponentType<{
    value: FlowWizardContextValue<TStep, TContextValue, TStepConfig>;
    children: ReactNode;
  }>;
  children?: ReactNode;
}>;

export function FlowWizardOrchestrator<
  TStep extends FlowStep,
  TContextValue,
  TStepConfig extends FlowStepConfig<TStep> = FlowStepConfig<TStep>,
>({
  flowConfig,
  stepRegistry,
  contextValue,
  ContextProvider,
  children,
}: FlowWizardOrchestratorProps<TStep, TContextValue, TStepConfig>) {
  const { state, actions, currentStepConfig } = useFlowWizardOrchestrator<TStep, TStepConfig>({
    flowConfig,
  });

  const currentStepRenderer = useMemo(() => {
    const renderer = stepRegistry[state.currentStep];
    return renderer ?? null;
  }, [state.currentStep, stepRegistry]);

  const enhancedContextValue = useMemo<FlowWizardContextValue<TStep, TContextValue, TStepConfig>>(
    () => ({
      ...contextValue,
      navigation: actions,
      currentStep: state.currentStep,
      direction: state.direction,
      currentStepConfig,
      currentStepRenderer,
      stepHistory: state.stepHistory,
    }),
    [
      contextValue,
      actions,
      state.currentStep,
      state.direction,
      currentStepConfig,
      currentStepRenderer,
      state.stepHistory,
    ],
  );

  return <ContextProvider value={enhancedContextValue}>{children}</ContextProvider>;
}

export default FlowWizardOrchestrator;
