import { useCallback, useMemo } from "react";
import { usePostOnboardingHubState } from "@ledgerhq/live-common/postOnboarding/hooks/index";
import { track } from "~/analytics";
import { isPostOnboardingHubActionFulfilled } from "~/logic/postOnboarding/postOnboardingHubCompletion";
import { usePostOnboardingHubCompletionContext } from "~/logic/postOnboarding/usePostOnboardingHubCompletionContext";
import { useNavigateToPostOnboardingHubCallback } from "~/logic/postOnboarding/useNavigateToPostOnboardingHubCallback";
import type { UseOnboardingWidgetViewModelResult } from "./types";

export const useOnboardingWidgetViewModel = (): UseOnboardingWidgetViewModelResult => {
  const { actionsState, deviceModelId } = usePostOnboardingHubState();
  const navigateToPostOnboardingHub = useNavigateToPostOnboardingHubCallback();
  const hubCompletionContext = usePostOnboardingHubCompletionContext();

  const { currentStep, totalSteps, stepperLabel } = useMemo(() => {
    const actionsTotal = actionsState.length;
    const actionsCompleted = actionsState.filter(a =>
      isPostOnboardingHubActionFulfilled(a, hubCompletionContext),
    ).length;
    const total = 1 + Math.max(actionsTotal, 1);
    const displayStep = 1 + actionsCompleted;
    const arcStep =
      actionsTotal > 0 && actionsCompleted === actionsTotal ? total : actionsCompleted;
    return {
      currentStep: arcStep,
      totalSteps: total,
      stepperLabel: `${displayStep}/${total}`,
    };
  }, [actionsState, hubCompletionContext]);

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
