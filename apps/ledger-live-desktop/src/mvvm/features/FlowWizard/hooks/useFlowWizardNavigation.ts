import { useCallback, useMemo, useReducer, type Reducer } from "react";
import type {
  FlowStep,
  FlowNavigationActions,
  FlowStepConfig,
  FlowNavigationState,
  UseFlowWizardNavigationParams,
  UseFlowWizardNavigationResult,
} from "@ledgerhq/live-common/flows/wizard/types";
import {
  type NavigationAction,
  getStepIndex,
  createNavigationReducer,
  createInitialNavigationState,
  canNavigateBack,
  canNavigateForward,
} from "@ledgerhq/live-common/flows/wizard/helpers";

export function useFlowWizardNavigation<
  TStep extends FlowStep,
  TStepConfig extends FlowStepConfig<TStep> = FlowStepConfig<TStep>,
>({
  flowConfig,
}: UseFlowWizardNavigationParams<TStep, TStepConfig>): UseFlowWizardNavigationResult<
  TStep,
  TStepConfig
> {
  const { stepOrder, stepConfigs, initialStep, initialHistory } = flowConfig;

  const computedInitialStep = useMemo(() => {
    if (initialStep) return initialStep;
    return stepOrder[0];
  }, [initialStep, stepOrder]);

  const reducer: Reducer<
    FlowNavigationState<TStep>,
    NavigationAction<TStep, TStepConfig>
  > = useMemo(() => createNavigationReducer<TStep, TStepConfig>(stepOrder), [stepOrder]);
  const [state, dispatch] = useReducer(reducer, undefined, () =>
    createInitialNavigationState(computedInitialStep, initialHistory),
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
    return canNavigateBack(state.currentStep, state.stepHistory, stepConfigs);
  }, [state.currentStep, state.stepHistory, stepConfigs]);

  const canGoForward = useCallback(() => {
    return canNavigateForward(state.currentStep, stepOrder);
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
