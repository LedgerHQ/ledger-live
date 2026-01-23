import { useNavigation, CommonActions } from "@react-navigation/native";
import { SEND_FLOW_STEP_ORDER, SEND_STEP_CONFIGS } from "../constants";
import { SEND_FLOW_STEP } from "../types";
import type { SendFlowStep } from "../types";

/**
 * Hook to access Send Flow navigation actions using React Navigation
 * This bridges the FlowWizard context with actual React Navigation
 */
export function useSendFlowNavigation() {
  const reactNavigation = useNavigation();

  // Helper to check if a string is a valid SendFlowStep
  const isValidSendFlowStep = (step: string): step is SendFlowStep => {
    return Object.values(SEND_FLOW_STEP).some(validStep => validStep === step);
  };

  // Get current step from route name
  const getCurrentStep = (): SendFlowStep => {
    const navigationState = reactNavigation.getState();
    const currentIndex = navigationState?.index;
    const routes = navigationState?.routes;

    if (currentIndex !== undefined && routes && routes[currentIndex]) {
      const currentRouteName = routes[currentIndex].name;

      // Map screen names back to steps
      const stepEntries = Object.entries(SEND_STEP_CONFIGS);
      for (const [step, config] of stepEntries) {
        if (config.screenName === currentRouteName && isValidSendFlowStep(step)) {
          return step;
        }
      }
    }

    return SEND_FLOW_STEP.RECIPIENT; // fallback
  };

  const goToNextStep = () => {
    const currentStep = getCurrentStep();
    const currentIndex = SEND_FLOW_STEP_ORDER.indexOf(currentStep);
    const nextIndex = currentIndex + 1;

    if (nextIndex < SEND_FLOW_STEP_ORDER.length) {
      const nextStep = SEND_FLOW_STEP_ORDER[nextIndex];
      const nextConfig = SEND_STEP_CONFIGS[nextStep];
      const nextScreenName = nextConfig.screenName;

      if (nextScreenName) {
        // Use CommonActions.navigate to avoid TypeScript issues
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

  const goToStep = (step: SendFlowStep) => {
    const config = SEND_STEP_CONFIGS[step];
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
    const currentIndex = SEND_FLOW_STEP_ORDER.indexOf(currentStep);
    return currentIndex < SEND_FLOW_STEP_ORDER.length - 1;
  };

  return {
    navigation: {
      goToNextStep,
      goToPreviousStep,
      goToStep,
      canGoBack,
      canGoForward,
    },
    currentStep: getCurrentStep(),
    direction: "forward" as const,
    currentStepConfig: SEND_STEP_CONFIGS[getCurrentStep()],
  };
}
