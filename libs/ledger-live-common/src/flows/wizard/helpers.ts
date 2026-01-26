import {
  FLOW_NAVIGATION_DIRECTION,
  type FlowStep,
  type FlowNavigationState,
  type FlowNavigationDirection,
  type FlowStepConfig,
} from "./types";

export type NavigationAction<TStep extends FlowStep, TStepConfig extends FlowStepConfig<TStep>> =
  | { type: "GO_TO_STEP"; step: TStep }
  | { type: "GO_FORWARD"; stepOrder: readonly TStep[] }
  | { type: "GO_BACKWARD"; stepConfigs: Record<TStep, TStepConfig> };

export function getStepIndex<TStep extends FlowStep>(
  step: TStep,
  stepOrder: readonly TStep[],
): number {
  return stepOrder.indexOf(step);
}

export function getNextStep<TStep extends FlowStep>(
  currentStep: TStep,
  stepOrder: readonly TStep[],
): TStep | null {
  const currentIndex = getStepIndex(currentStep, stepOrder);
  const nextIndex = currentIndex + 1;
  return nextIndex < stepOrder.length ? stepOrder[nextIndex] : null;
}

export function getPreviousStep<TStep extends FlowStep>(
  currentStep: TStep,
  stepOrder: readonly TStep[],
): TStep | null {
  const currentIndex = getStepIndex(currentStep, stepOrder);
  const prevIndex = currentIndex - 1;
  return prevIndex >= 0 ? stepOrder[prevIndex] : null;
}

export function determineDirection<TStep extends FlowStep>(
  currentStep: TStep,
  targetStep: TStep,
  stepOrder: readonly TStep[],
): FlowNavigationDirection {
  const currentIndex = getStepIndex(currentStep, stepOrder);
  const targetIndex = getStepIndex(targetStep, stepOrder);
  return targetIndex > currentIndex
    ? FLOW_NAVIGATION_DIRECTION.FORWARD
    : FLOW_NAVIGATION_DIRECTION.BACKWARD;
}

export function isFirstStep<TStep extends FlowStep>(
  step: TStep,
  stepOrder: readonly TStep[],
): boolean {
  return getStepIndex(step, stepOrder) === 0;
}

export function isLastStep<TStep extends FlowStep>(
  step: TStep,
  stepOrder: readonly TStep[],
): boolean {
  return getStepIndex(step, stepOrder) === stepOrder.length - 1;
}

export function createInitialNavigationState<TStep extends FlowStep>(
  initialStep: TStep,
  initialHistory: TStep[] = [],
): FlowNavigationState<TStep> {
  return {
    currentStep: initialStep,
    direction: FLOW_NAVIGATION_DIRECTION.FORWARD,
    stepHistory: initialHistory,
  };
}

export function createNavigationReducer<
  TStep extends FlowStep,
  TStepConfig extends FlowStepConfig<TStep> = FlowStepConfig<TStep>,
>(stepOrder: readonly TStep[]) {
  return function navigationReducer(
    state: FlowNavigationState<TStep>,
    action: NavigationAction<TStep, TStepConfig>,
  ): FlowNavigationState<TStep> {
    switch (action.type) {
      case "GO_TO_STEP": {
        if (action.step === state.currentStep) return state;
        const direction = determineDirection(state.currentStep, action.step, stepOrder);
        const newHistory =
          direction === FLOW_NAVIGATION_DIRECTION.FORWARD
            ? [...state.stepHistory, state.currentStep]
            : state.stepHistory.slice(0, -1);
        return { currentStep: action.step, direction, stepHistory: newHistory };
      }

      case "GO_FORWARD": {
        const nextStep = getNextStep(state.currentStep, action.stepOrder);
        if (!nextStep) return state;
        return {
          currentStep: nextStep,
          direction: FLOW_NAVIGATION_DIRECTION.FORWARD,
          stepHistory: [...state.stepHistory, state.currentStep],
        };
      }

      case "GO_BACKWARD": {
        const config = action.stepConfigs[state.currentStep];
        if (!config?.canGoBack) return state;
        const previousStep = state.stepHistory.at(-1);
        if (!previousStep) return state;
        return {
          currentStep: previousStep,
          direction: FLOW_NAVIGATION_DIRECTION.BACKWARD,
          stepHistory: state.stepHistory.slice(0, -1),
        };
      }

      default:
        return state;
    }
  };
}

export function canNavigateBack<TStep extends FlowStep, TStepConfig extends FlowStepConfig<TStep>>(
  currentStep: TStep,
  stepHistory: TStep[],
  stepConfigs: Record<TStep, TStepConfig>,
): boolean {
  const config = stepConfigs[currentStep];
  return config?.canGoBack === true && stepHistory.length > 0;
}

export function canNavigateForward<TStep extends FlowStep>(
  currentStep: TStep,
  stepOrder: readonly TStep[],
): boolean {
  return getNextStep(currentStep, stepOrder) !== null;
}
