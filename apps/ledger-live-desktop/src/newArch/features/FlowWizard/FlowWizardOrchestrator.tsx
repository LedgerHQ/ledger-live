import React, { useMemo, type ComponentType, type ReactNode } from "react";
import type { StepRenderer } from "./types";
import { useFlowWizardNavigation } from "./hooks/useFlowWizardNavigation";
import type {
  FlowStep,
  FlowConfig,
  StepRegistry,
  FlowNavigationDirection,
  AnimationConfig,
  FlowWizardContextValue,
} from "./types";

const DEFAULT_ANIMATION_CONFIG: AnimationConfig = {
  forward: "animate-slide-in-from-right",
  backward: "animate-slide-in-from-left",
};

type FlowWizardOrchestratorProps<TStep extends FlowStep, TContextValue> = Readonly<{
  flowConfig: FlowConfig<TStep>;
  stepRegistry: StepRegistry<TStep>;
  contextValue: TContextValue;
  ContextProvider: ComponentType<{
    value: FlowWizardContextValue<TStep, TContextValue>;
    children: ReactNode;
  }>;
  animationConfig?: AnimationConfig;
  children?: ReactNode;
}>;

// Returns the transition class for the current direction; keeps UI concerns isolated here.
function getAnimationClass(
  direction: FlowNavigationDirection,
  config: AnimationConfig,
): string | undefined {
  return direction === "FORWARD" ? config.forward : config.backward;
}

/**
 * FlowWizardOrchestrator
 *
 * Generic runner for multi-step flows:
 * - drives navigation (forward/back/jump) via useFlowWizardNavigation
 * - injects navigation & step metadata into the provided ContextProvider
 * - renders the current step with optional enter animations
 * - remains UI-agnostic: only needs a step registry and a flow config
 */
export function FlowWizardOrchestrator<TStep extends FlowStep, TContextValue>({
  flowConfig,
  stepRegistry,
  contextValue,
  ContextProvider,
  animationConfig = DEFAULT_ANIMATION_CONFIG,
  children,
}: FlowWizardOrchestratorProps<TStep, TContextValue>) {
  const { state, actions, currentStepConfig } = useFlowWizardNavigation({ flowConfig });

  const enhancedContextValue = useMemo<FlowWizardContextValue<TStep, TContextValue>>(
    () => ({
      ...contextValue,
      navigation: actions,
      currentStep: state.currentStep,
      direction: state.direction,
      currentStepConfig,
    }),
    [contextValue, actions, state.currentStep, state.direction, currentStepConfig],
  );

  const StepComponent = useMemo<StepRenderer | null>(() => {
    const renderer = stepRegistry[state.currentStep];
    return renderer ?? null;
  }, [state.currentStep, stepRegistry]);

  const hasNavigated = state.stepHistory.length > 0 || state.direction === "BACKWARD";
  const animationClass = hasNavigated
    ? getAnimationClass(state.direction, animationConfig)
    : undefined;

  return (
    <ContextProvider value={enhancedContextValue}>
      {children}
      {StepComponent && (
        <div key={state.currentStep} className={animationClass}>
          <StepComponent />
        </div>
      )}
    </ContextProvider>
  );
}

// Need to use it to create the step registry typesafe
export function createStepRegistry<TStep extends FlowStep>(
  registry: StepRegistry<TStep>,
): StepRegistry<TStep> {
  return registry;
}
