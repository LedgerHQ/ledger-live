import { useEffect, useMemo, useState } from "react";
import type { PostOnboardingAction, PostOnboardingActionState } from "@ledgerhq/types-live";
import { isPostOnboardingHubActionFulfilled } from "~/logic/postOnboarding/postOnboardingHubCompletion";
import {
  type PostOnboardingHubCompletionContext,
  usePostOnboardingHubCompletionContext,
} from "~/logic/postOnboarding/usePostOnboardingHubCompletionContext";

async function countFulfilledPostOnboardingActions(
  actionsState: (PostOnboardingAction & PostOnboardingActionState)[],
  context: PostOnboardingHubCompletionContext,
): Promise<number> {
  const results = await Promise.all(
    actionsState.map(action =>
      action.disabled
        ? Promise.resolve(true)
        : isPostOnboardingHubActionFulfilled(action, context).catch(() => false),
    ),
  );
  return results.filter(Boolean).length;
}

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

    const run = async () => {
      const count = await countFulfilledPostOnboardingActions(actionsState, context);
      if (!cancelled) setFulfilledCount(count);
    };

    void run();

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
