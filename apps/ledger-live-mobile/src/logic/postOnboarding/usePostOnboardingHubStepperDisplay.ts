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
  const [fulfilledCount, setFulfilledCount] = useState<number | undefined>();

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const results = await Promise.all(
        actionsState.map(action =>
          action.disabled
            ? true
            : isPostOnboardingHubActionFulfilled(action, context).catch(() => false),
        ),
      );
      if (!cancelled) setFulfilledCount(results.filter(Boolean).length);
    })();

    return () => {
      cancelled = true;
    };
  }, [actionsState, context]);

  return useMemo(() => {
    const n = actionsState.length;
    const fulfilled = fulfilledCount ?? 0;
    const totalSteps = 1 + Math.max(n, 1);
    const step = fulfilled + 1;

    return {
      totalSteps,
      stepperLabel: `${step}/${totalSteps}`,
      areAllActionsCompleted: n > 0 && fulfilled === n,
      currentStep: n === 0 ? 0 : step,
      loading: fulfilledCount === undefined,
    };
  }, [actionsState, fulfilledCount]);
}
