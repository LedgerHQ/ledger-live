import { useCallback, useMemo, useReducer } from "react";
import {
  FLOW_NAVIGATION_DIRECTION,
  type FlowStep,
  type FlowNavigationState,
  type FlowNavigationActions,
  type FlowStepConfig,
  type UseFlowWizardNavigationParams,
  type UseFlowWizardNavigationResult,
} from "../types";

type NavigationAction<TStep extends FlowStep> =
  | { type: "GO_TO_STEP"; step: TStep }
  | { type: "GO_FORWARD"; stepOrder: readonly TStep[] }
  | { type: "GO_BACKWARD"; stepConfigs: Record<TStep, FlowStepConfig<TStep>> };

function getStepIndex<TStep extends FlowStep>(step: TStep, stepOrder: readonly TStep[]): number {
  return stepOrder.indexOf(step);
}

function getNextStep<TStep extends FlowStep>(
  currentStep: TStep,
  stepOrder: readonly TStep[],
): TStep | null {
  const currentIndex = getStepIndex(currentStep, stepOrder);
  const nextIndex = currentIndex + 1;
  return nextIndex < stepOrder.length ? stepOrder[nextIndex] : null;
}

function determineDirection<TStep extends FlowStep>(
  currentStep: TStep,
  targetStep: TStep,
  stepOrder: readonly TStep[],
): string {
  const currentIndex = getStepIndex(currentStep, stepOrder);
  const targetIndex = getStepIndex(targetStep, stepOrder);
  return targetIndex > currentIndex
    ? FLOW_NAVIGATION_DIRECTION.FORWARD
    : FLOW_NAVIGATION_DIRECTION.BACKWARD;
}

function createNavigationReducer<TStep extends FlowStep>(stepOrder: readonly TStep[]) {
  return function navigationReducer(
    state: FlowNavigationState<TStep>,
    action: NavigationAction<TStep>,
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
        const previousStep = state.stepHistory[state.stepHistory.length - 1];
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

function createInitialState<TStep extends FlowStep>(
  initialStep: TStep,
  initialHistory: TStep[] = [],
): FlowNavigationState<TStep> {
  return {
    currentStep: initialStep,
    direction: FLOW_NAVIGATION_DIRECTION.FORWARD,
    stepHistory: initialHistory,
  };
}

export function useFlowWizardNavigation<TStep extends FlowStep>({
  flowConfig,
}: UseFlowWizardNavigationParams<TStep>): UseFlowWizardNavigationResult<TStep> {
  const { stepOrder, stepConfigs, initialStep, initialHistory } = flowConfig;

  const computedInitialStep = useMemo(() => {
    if (initialStep) return initialStep;
    return stepOrder[0];
  }, [initialStep, stepOrder]);

  const reducer = useMemo(() => createNavigationReducer(stepOrder), [stepOrder]);
  const [state, dispatch] = useReducer(reducer, undefined, () =>
    createInitialState(computedInitialStep, initialHistory),
  );

  const goToStep = useCallback((step: TStep) => {
    dispatch({ type: "GO_TO_STEP", step });
  }, []);

  const goToNextStep = useCallback(() => {
    dispatch({ type: "GO_FORWARD", stepOrder });
  }, [stepOrder]);

  const goToPreviousStep = useCallback(() => {
    dispatch({ type: "GO_BACKWARD", stepConfigs });
  }, [stepConfigs]);

  const canGoBack = useCallback(() => {
    const config = stepConfigs[state.currentStep];
    return config?.canGoBack === true && state.stepHistory.length > 0;
  }, [state.currentStep, state.stepHistory.length, stepConfigs]);

  const canGoForward = useCallback(() => {
    return getNextStep(state.currentStep, stepOrder) !== null;
  }, [state.currentStep, stepOrder]);

  const actions: FlowNavigationActions<TStep> = useMemo(
    () => ({ goToStep, goToNextStep, goToPreviousStep, canGoBack, canGoForward }),
    [goToStep, goToNextStep, goToPreviousStep, canGoBack, canGoForward],
  );

  const currentStepConfig = stepConfigs[state.currentStep];
  const currentStepIndex = getStepIndex(state.currentStep, stepOrder);
  const isFirstStep = currentStepIndex === 0;
  const isLastStep = currentStepIndex === stepOrder.length - 1;

  return { state, actions, currentStepConfig, isFirstStep, isLastStep };
}
