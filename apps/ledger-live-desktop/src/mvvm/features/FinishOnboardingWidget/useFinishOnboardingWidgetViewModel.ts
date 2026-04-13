import { useCallback, useMemo } from "react";
import { track } from "~/renderer/analytics/segment";
import { usePostOnboardingHubState } from "@ledgerhq/live-common/postOnboarding/hooks/index";
import { useNavigateToPostOnboardingHubCallback } from "~/renderer/components/PostOnboardingHub/logic/useNavigateToPostOnboardingHubCallback";

const TRACK_BUTTON_CLICKED_PROPERTY = {
  button: "Post onboarding widget",
  flow: "post-onboarding",
} as const;

export type FinishOnboardingWidgetViewProps = {
  readonly postOnboardingInProgress: boolean;
  readonly currentStep: number;
  readonly totalSteps: number;
  readonly handleNavigateToPostOnboardingHub: () => void;
};

export function useFinishOnboardingWidgetViewModel(): FinishOnboardingWidgetViewProps {
  const navigateToPostOnboardingHub = useNavigateToPostOnboardingHubCallback();
  const { deviceModelId, actionsState, postOnboardingInProgress } = usePostOnboardingHubState();

  const currentStep = actionsState.filter(action => action.completed).length + 1;
  const totalSteps = actionsState.length + 1;

  const handleNavigateToPostOnboardingHub = useCallback(() => {
    track("button_clicked", {
      deviceModelId,
      ...TRACK_BUTTON_CLICKED_PROPERTY,
    });
    navigateToPostOnboardingHub();
  }, [navigateToPostOnboardingHub, deviceModelId]);

  return useMemo(
    () => ({
      postOnboardingInProgress,
      currentStep,
      totalSteps,
      handleNavigateToPostOnboardingHub,
    }),
    [
      postOnboardingInProgress,
      currentStep,
      totalSteps,
      handleNavigateToPostOnboardingHub,
    ],
  );
}
