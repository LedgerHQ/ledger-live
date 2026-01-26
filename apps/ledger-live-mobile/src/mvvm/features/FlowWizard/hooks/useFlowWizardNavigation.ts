import { useNavigation, CommonActions } from "@react-navigation/native";
import type {
  FlowStep,
  FlowConfig,
  FlowNavigationActions,
  FlowNavigationState,
} from "@ledgerhq/live-common/flows/wizard/types";
import { FLOW_NAVIGATION_DIRECTION } from "@ledgerhq/live-common/flows/wizard/types";
import type { ReactNativeFlowStepConfig } from "../types.native";

/**
 * Generic hook to access Flow Wizard navigation actions using React Navigation
 * This bridges any FlowWizard context with actual React Navigation
 */
export function useFlowWizardNavigation<
  TStep extends FlowStep = FlowStep,
  TStepConfig extends ReactNativeFlowStepConfig<TStep> = ReactNativeFlowStepConfig<TStep>,
>({
  flowConfig,
  stepValues,
  fallbackStep,
}: {
  flowConfig: FlowConfig<TStep, TStepConfig>;
  stepValues: Record<string, TStep>;
  fallbackStep: TStep;
}) {
  const { stepOrder, stepConfigs } = flowConfig;
  const reactNavigation = useNavigation();

  // Helper to check if a string is a valid flow step
  const isValidFlowStep = (step: string): step is TStep => {
    return Object.values(stepValues).some(validStep => validStep === step);
  };

  // Get current step from route name
  const getCurrentStep = (): TStep => {
    const navigationState = reactNavigation.getState();
    const currentIndex = navigationState?.index;
    const routes = navigationState?.routes;

    if (currentIndex !== undefined && routes && routes[currentIndex]) {
      const currentRouteName = routes[currentIndex].name;

      // Map screen names back to steps
      for (const step in stepConfigs) {
        const config = stepConfigs[step];
        if (config.screenName === currentRouteName && isValidFlowStep(step)) {
          return step;
        }
      }
    }

    return fallbackStep;
  };

  const goToNextStep = () => {
    const currentStep = getCurrentStep();
    const currentIndex = stepOrder.indexOf(currentStep);
    const nextIndex = currentIndex + 1;

    if (nextIndex < stepOrder.length) {
      const nextStep = stepOrder[nextIndex];
      const nextConfig = stepConfigs[nextStep];
      const nextScreenName = nextConfig.screenName;

      if (nextScreenName) {
        reactNavigation.dispatch(
          CommonActions.navigate({
            name: nextScreenName,
          }),
        );
      }
    }
  };

  const goToPreviousStep = () => {
    if (reactNavigation.canGoBack()) {
      reactNavigation.goBack();
    }
  };

  const goToStep = (step: TStep) => {
    const config = stepConfigs[step];
    if (config.screenName) {
      reactNavigation.dispatch(
        CommonActions.navigate({
          name: config.screenName,
        }),
      );
    }
  };

  const canGoBack = () => {
    return reactNavigation.canGoBack();
  };

  const canGoForward = () => {
    const currentStep = getCurrentStep();
    const currentIndex = stepOrder.indexOf(currentStep);
    return currentIndex < stepOrder.length - 1;
  };

  const navigation: FlowNavigationActions<TStep> = {
    goToNextStep,
    goToPreviousStep,
    goToStep,
    canGoBack,
    canGoForward,
  };

  return {
    navigation,
    currentStep: getCurrentStep(),
    direction: FLOW_NAVIGATION_DIRECTION.FORWARD,
    currentStepConfig: stepConfigs[getCurrentStep()],
  };
}

/**
 * Alternative hook interface for orchestrators that expect state/actions structure
 * This maintains compatibility with existing orchestrator code
 */
export function useFlowWizardOrchestrator<
  TStep extends FlowStep = FlowStep,
  TStepConfig extends ReactNativeFlowStepConfig<TStep> = ReactNativeFlowStepConfig<TStep>,
>({ flowConfig }: { flowConfig: FlowConfig<TStep, TStepConfig> }) {
  const { stepOrder, stepConfigs } = flowConfig;
  const reactNavigation = useNavigation();

  const getCurrentStep = (): TStep => {
    // Get the initial step if available
    return flowConfig.initialStep || stepOrder[0];
  };

  const goToNextStep = () => {
    const currentStep = getCurrentStep();
    const currentIndex = stepOrder.indexOf(currentStep);
    const nextIndex = currentIndex + 1;

    if (nextIndex < stepOrder.length) {
      const nextStep = stepOrder[nextIndex];
      const nextConfig = stepConfigs[nextStep];
      const nextScreenName = nextConfig.screenName;

      if (nextScreenName) {
        reactNavigation.dispatch(
          CommonActions.navigate({
            name: nextScreenName,
          }),
        );
      }
    }
  };

  const goToPreviousStep = () => {
    if (reactNavigation.canGoBack()) {
      reactNavigation.goBack();
    }
  };

  const goToStep = (step: TStep) => {
    const config = stepConfigs[step];
    if (config.screenName) {
      reactNavigation.dispatch(
        CommonActions.navigate({
          name: config.screenName,
        }),
      );
    }
  };

  const canGoBack = () => {
    return reactNavigation.canGoBack();
  };

  const canGoForward = () => {
    const currentStep = getCurrentStep();
    const currentIndex = stepOrder.indexOf(currentStep);
    return currentIndex < stepOrder.length - 1;
  };

  const actions: FlowNavigationActions<TStep> = {
    goToNextStep,
    goToPreviousStep,
    goToStep,
    canGoBack,
    canGoForward,
  };

  const state: FlowNavigationState<TStep> = {
    currentStep: getCurrentStep(),
    direction: FLOW_NAVIGATION_DIRECTION.FORWARD,
    stepHistory: [],
  };

  return {
    state,
    actions,
    currentStepConfig: stepConfigs[getCurrentStep()],
  };
}
