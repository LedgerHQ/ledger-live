import React, { useMemo, type ReactNode, type CSSProperties } from "react";
import { useFlowWizardNavigation } from "./hooks/useFlowWizardNavigation";
import { FlowWizardProvider } from "./FlowWizardContext";
import type {
  FlowStep,
  FlowConfig,
  StepRegistry,
  StepRenderer,
  FlowNavigationDirection,
  AnimationConfig,
  FlowStepConfig,
} from "./types";

const DEFAULT_ANIMATION_CONFIG: AnimationConfig = {
  forward: "animate-fade-in",
  backward: "animate-fade-out",
};

type FlowWizardOrchestratorProps<
  TStep extends FlowStep,
  TStepConfig extends FlowStepConfig<TStep> = FlowStepConfig<TStep>,
> = Readonly<{
  flowConfig: FlowConfig<TStep, TStepConfig>;
  stepRegistry: StepRegistry<TStep>;
  animationConfig?: AnimationConfig;
  getContainerStyle?: (stepConfig: TStepConfig) => CSSProperties | undefined;
  children?: ReactNode;
}>;

function getAnimationClass(
  direction: FlowNavigationDirection,
  config: AnimationConfig,
): string | undefined {
  return direction === "FORWARD" ? config.forward : config.backward;
}

/**
 * FlowWizardOrchestrator
 *
 * Generic orchestrator for all multi-step flows
 *
 * @example
 * // Custom layout (children handle rendering via useFlowWizard)
 * <FlowWizardOrchestrator flowConfig={config} stepRegistry={registry}>
 *   <MyCustomLayout />
 * </FlowWizardOrchestrator>
 */
export function FlowWizardOrchestrator<
  TStep extends FlowStep,
  TStepConfig extends FlowStepConfig<TStep> = FlowStepConfig<TStep>,
>({
  flowConfig,
  stepRegistry,
  animationConfig = DEFAULT_ANIMATION_CONFIG,
  getContainerStyle,
  children,
}: FlowWizardOrchestratorProps<TStep, TStepConfig>) {
  const { state, actions, currentStepConfig } = useFlowWizardNavigation<TStep, TStepConfig>({
    flowConfig,
  });

  const StepComponent = useMemo<StepRenderer | null>(() => {
    const renderer = stepRegistry[state.currentStep];
    return renderer ?? null;
  }, [state.currentStep, stepRegistry]);

  const wizardContextValue = useMemo(
    () => ({
      navigation: actions,
      currentStep: state.currentStep,
      direction: state.direction,
      currentStepConfig,
      currentStepRenderer: StepComponent,
      stepHistory: state.stepHistory,
    }),
    [
      actions,
      state.currentStep,
      state.direction,
      currentStepConfig,
      StepComponent,
      state.stepHistory,
    ],
  );

  const hasNavigated = state.stepHistory.length > 0 || state.direction === "BACKWARD";
  const animationClass = hasNavigated
    ? getAnimationClass(state.direction, animationConfig)
    : undefined;

  const containerStyle = getContainerStyle ? getContainerStyle(currentStepConfig) : undefined;

  // Custom layout mode: children handle rendering via useFlowWizard()
  if (children) {
    return <FlowWizardProvider value={wizardContextValue}>{children}</FlowWizardProvider>;
  }

  // Default rendering mode: render steps with animations
  return (
    <FlowWizardProvider value={wizardContextValue}>
      <div className="flex flex-col" style={containerStyle}>
        {StepComponent && (
          <div key={state.currentStep} className={`min-h-0 flex-1 ${animationClass ?? ""}`}>
            <StepComponent />
          </div>
        )}
      </div>
    </FlowWizardProvider>
  );
}

// Used to create a type-safe step registry
export function createStepRegistry<TStep extends FlowStep>(
  registry: StepRegistry<TStep>,
): StepRegistry<TStep> {
  return registry;
}
