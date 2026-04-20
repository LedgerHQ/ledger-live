import { useCallback } from "react";
import { track } from "~/analytics";
import { usePostOnboardingHubState } from "@ledgerhq/live-common/postOnboarding/hooks/index";
import { usePostOnboardingHubStepperDisplay } from "~/logic/postOnboarding/usePostOnboardingHubStepperDisplay";
import { usePostOnboardingHubDrawer } from "LLM/features/PostOnboardingHubDrawer";
import type { UseOnboardingWidgetViewModelResult } from "./types";

export const useOnboardingWidgetViewModel = (): UseOnboardingWidgetViewModelResult => {
  const { actionsState, deviceModelId } = usePostOnboardingHubState();
  const { openPostOnboardingHubDrawer } = usePostOnboardingHubDrawer();
  const { currentStep, totalSteps, stepperLabel, loading } =
    usePostOnboardingHubStepperDisplay(actionsState);

  const onPress = useCallback(() => {
    track("button_clicked", {
      button: "Post onboarding widget",
      deviceModelId,
      flow: "post-onboarding",
    });
    if (!deviceModelId) return;
    openPostOnboardingHubDrawer();
  }, [deviceModelId, openPostOnboardingHubDrawer]);

  return {
    currentStep,
    totalSteps,
    stepperLabel,
    onPress,
    loading,
  };
};
