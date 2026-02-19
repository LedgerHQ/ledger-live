import { useCallback, useMemo } from "react";
import { track } from "~/analytics";
import { usePostOnboardingHubState } from "@ledgerhq/live-common/postOnboarding/hooks/index";
import { useNavigateToPostOnboardingHubCallback } from "~/logic/postOnboarding/useNavigateToPostOnboardingHubCallback";
import type { UseOnboardingWidgetViewModelResult } from "./types";

export const useOnboardingWidgetViewModel = (): UseOnboardingWidgetViewModelResult => {
  const { actionsState, deviceModelId } = usePostOnboardingHubState();
  const navigateToPostOnboardingHub = useNavigateToPostOnboardingHubCallback();

  const { currentStep, totalSteps, stepperLabel } = useMemo(() => {
    const actionsTotal = actionsState.length;
    const actionsCompleted = actionsState.filter(a => a.completed).length;
    const total = 1 + Math.max(actionsTotal, 1);
    return {
      currentStep: actionsCompleted,
      totalSteps: total,
      stepperLabel: `${1 + actionsCompleted}/${total}`,
    };
  }, [actionsState]);

  const onPress = useCallback(() => {
    track("button_clicked", {
      button: "Post onboarding widget",
      deviceModelId,
      flow: "post-onboarding",
    });
    navigateToPostOnboardingHub();
  }, [deviceModelId, navigateToPostOnboardingHub]);

  return {
    currentStep,
    totalSteps,
    stepperLabel,
    onPress,
  };
};
