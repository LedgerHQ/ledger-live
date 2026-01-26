import React, { useMemo, type ComponentType, type ReactNode } from "react";
import { useFlowWizardNavigation } from "./hooks/useFlowWizardNavigation";
import type {
  FlowStep,
  FlowConfig,
  StepRegistry,
  FlowWizardContextValue,
  FlowStepConfig,
} from "@ledgerhq/live-common/flows/wizard/types";

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
  stepRegistry: _stepRegistry,
  contextValue,
  ContextProvider,
  children,
}: FlowWizardOrchestratorProps<TStep, TContextValue, TStepConfig>) {
  const { state, actions, currentStepConfig } = useFlowWizardNavigation<TStep, TStepConfig>({
    flowConfig,
  });

  const enhancedContextValue = useMemo<FlowWizardContextValue<TStep, TContextValue, TStepConfig>>(
    () => ({
      ...contextValue,
      navigation: actions,
      currentStep: state.currentStep,
      direction: state.direction,
      currentStepConfig,
    }),
    [contextValue, actions, state.currentStep, state.direction, currentStepConfig],
  );

  return <ContextProvider value={enhancedContextValue}>{children}</ContextProvider>;
}
