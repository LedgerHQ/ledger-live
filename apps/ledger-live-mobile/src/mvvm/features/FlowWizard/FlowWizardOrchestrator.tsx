import React, { useEffect, useMemo, useRef, type ComponentType, type ReactNode } from "react";
import { Animated, type StyleProp, type ViewStyle, View } from "react-native";
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
  getContainerStyle?: (stepConfig: TStepConfig) => StyleProp<ViewStyle> | undefined;
  children?: ReactNode;
}>;

function getAnimationClass(
  direction: FlowNavigationDirection,
  config: AnimationConfig,
): string | undefined {
  return direction === "FORWARD" ? config.forward : config.backward;
}

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
    return stepRegistry[state.currentStep] ?? null;
  }, [state.currentStep, stepRegistry]);
  const hasNavigated = state.stepHistory.length > 0 || state.direction === "BACKWARD";

  // React Native: we don't use CSS classes. If the caller provided a non-empty animation config
  // for the current direction, we apply a simple fade-in animation on step changes.
  const shouldAnimate =
    hasNavigated && Boolean(getAnimationClass(state.direction, animationConfig) ?? "");
  const opacity = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (!shouldAnimate) return;
    opacity.setValue(0);
    Animated.timing(opacity, {
      toValue: 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [opacity, shouldAnimate, state.currentStep]);

  const containerStyle = getContainerStyle ? getContainerStyle(currentStepConfig) : undefined;

  return (
    <ContextProvider value={enhancedContextValue}>
      <View style={containerStyle}>
        {children}
        {StepComponent ? (
          <Animated.View
            // key forces a full remount on step change (same behavior as desktop)
            key={state.currentStep}
            style={{ flex: 1, opacity: shouldAnimate ? opacity : 1 }}
          >
            <StepComponent />
          </Animated.View>
        ) : null}
      </View>
    </ContextProvider>
  );
}

export function createStepRegistry<TStep extends FlowStep>(
  registry: StepRegistry<TStep>,
): StepRegistry<TStep> {
  return registry;
}

export default FlowWizardOrchestrator;
