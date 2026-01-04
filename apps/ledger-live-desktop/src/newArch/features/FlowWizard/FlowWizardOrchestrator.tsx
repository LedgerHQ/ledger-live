import React, { useMemo, type ComponentType, type ReactNode, type CSSProperties } from "react";
import { useFlowWizardNavigation } from "./hooks/useFlowWizardNavigation";
import type {
  FlowStep,
  FlowConfig,
  StepRegistry,
  StepRenderer,
  FlowNavigationDirection,
  AnimationConfig,
  FlowWizardContextValue,
  FlowStepConfig,
} from "./types";

const DEFAULT_ANIMATION_CONFIG: AnimationConfig = {
  forward: "animate-fade-in",
  backward: "animate-fade-out",
};

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
  animationConfig?: AnimationConfig;
  getContainerStyle?: (stepConfig: TStepConfig) => CSSProperties | undefined;
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
export function FlowWizardOrchestrator<
  TStep extends FlowStep,
  TContextValue,
  TStepConfig extends FlowStepConfig<TStep> = FlowStepConfig<TStep>,
>({
  flowConfig,
  stepRegistry,
  contextValue,
  ContextProvider,
  animationConfig = DEFAULT_ANIMATION_CONFIG,
  getContainerStyle,
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

  const StepComponent = useMemo<StepRenderer | null>(() => {
    const renderer = stepRegistry[state.currentStep];
    return renderer ?? null;
  }, [state.currentStep, stepRegistry]);

  const hasNavigated = state.stepHistory.length > 0 || state.direction === "BACKWARD";
  const animationClass = hasNavigated
    ? getAnimationClass(state.direction, animationConfig)
    : undefined;

  const containerStyle = getContainerStyle ? getContainerStyle(currentStepConfig) : undefined;

  return (
    <ContextProvider value={enhancedContextValue}>
      <div className="flex flex-col" style={containerStyle}>
        {children}
        {StepComponent && (
          <div key={state.currentStep} className={`min-h-0 flex-1 ${animationClass ?? ""}`}>
            <StepComponent />
          </div>
        )}
      </div>
    </ContextProvider>
  );
}

// Used to create a type-safe step registry
export function createStepRegistry<TStep extends FlowStep>(
  registry: StepRegistry<TStep>,
): StepRegistry<TStep> {
  return registry;
}
