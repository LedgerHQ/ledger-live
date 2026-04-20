import { useEffect, useMemo, useState } from "react";
import type { PostOnboardingAction, PostOnboardingActionState } from "@ledgerhq/types-live";
import { isPostOnboardingHubActionFulfilled } from "~/logic/postOnboarding/postOnboardingHubCompletion";
import { usePostOnboardingHubCompletionContext } from "~/logic/postOnboarding/usePostOnboardingHubCompletionContext";

export type PostOnboardingHubStepperDisplay = {
  currentStep: number;
  totalSteps: number;
  stepperLabel: string;
  loading: boolean;
  areAllActionsCompleted: boolean;
};

export function usePostOnboardingHubStepperDisplay(
  actionsState: (PostOnboardingAction & PostOnboardingActionState)[],
): PostOnboardingHubStepperDisplay {
  const context = usePostOnboardingHubCompletionContext();
  const [actionsCompleted, setActionsCompleted] = useState<number | undefined>();

  useEffect(() => {
    let cancelled = false;
    Promise.all(
      actionsState.map(action =>
        action.disabled
          ? Promise.resolve(true)
          : isPostOnboardingHubActionFulfilled(action, context).catch(() => false),
      ),
    ).then(results => {
      if (cancelled) return;
      setActionsCompleted(results.filter(Boolean).length);
    });
    return () => {
      cancelled = true;
    };
  }, [actionsState, context]);

  return useMemo(() => {
    const actionsTotal = actionsState.length;
    const completed = actionsCompleted ?? 0;
    const totalSteps = 1 + Math.max(actionsTotal, 1);
    const displayStep = 1 + completed;
    const areAllActionsCompleted = actionsTotal > 0 && completed === actionsTotal;
    const currentStep = areAllActionsCompleted ? totalSteps : completed;
    return {
      currentStep,
      totalSteps,
      stepperLabel: `${displayStep}/${totalSteps}`,
      loading: actionsCompleted === undefined,
      areAllActionsCompleted,
    };
  }, [actionsState, actionsCompleted]);
}
