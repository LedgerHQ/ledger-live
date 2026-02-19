import { useCallback, useEffect, useMemo, useState } from "react";
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

  const [actionsCompleted, setActionsCompleted] = useState<number | undefined>();

  useEffect(() => {
    async function getCompletedActions() {
      const actions = await Promise.all(
        actionsState.map(async a => {
          try {
            const result = await isPostOnboardingHubActionFulfilled(a, hubCompletionContext);
            return result;
          } catch {
            return false;
          }
        }),
      );
      const fulfilledActions = actions.filter(a => !!a).length;
      if (actionsCompleted !== fulfilledActions) {
        setActionsCompleted(fulfilledActions);
      }
    }
    getCompletedActions();
  }, [actionsState, hubCompletionContext]);

  const { currentStep, totalSteps, stepperLabel } = useMemo(() => {
    const actionsTotal = actionsState.length;
    const actionsCompletedAmount = actionsCompleted || 0;
    const total = 1 + Math.max(actionsTotal, 1);
    const displayStep = 1 + actionsCompletedAmount;
    const arcStep =
      actionsTotal > 0 && actionsCompletedAmount === actionsTotal ? total : actionsCompletedAmount;
    return {
      currentStep: arcStep,
      totalSteps: total,
      stepperLabel: `${displayStep}/${total}`,
    };
  }, [actionsState, actionsCompleted]);

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
    loading: actionsCompleted === undefined,
  };
};
