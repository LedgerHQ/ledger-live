import { useEffect, useMemo, useState } from "react";
import type {
  PostOnboardingAction,
  PostOnboardingActionId,
  PostOnboardingActionState,
} from "@ledgerhq/types-live";
import { isPostOnboardingHubActionFulfilled } from "./postOnboardingHubCompletion";
import {
  type PostOnboardingHubCompletionContext,
  usePostOnboardingHubCompletionContext,
} from "./usePostOnboardingHubCompletionContext";

type PostOnboardingHubActionCompletion = {
  id: PostOnboardingActionId;
  isActionCompleted: boolean;
  countsAsFulfilled: boolean;
};

async function getPostOnboardingActionsCompletion(
  actionsState: (PostOnboardingAction & PostOnboardingActionState)[],
  context: PostOnboardingHubCompletionContext,
): Promise<PostOnboardingHubActionCompletion[]> {
  return Promise.all(
    actionsState.map(async action => {
      if (action.disabled) {
        return {
          id: action.id,
          isActionCompleted: action.completed,
          countsAsFulfilled: true,
        };
      }

      const isActionCompleted = await isPostOnboardingHubActionFulfilled(action, context).catch(
        () => false,
      );

      return {
        id: action.id,
        isActionCompleted,
        countsAsFulfilled: isActionCompleted,
      };
    }),
  );
}

export type PostOnboardingHubStepperDisplay = {
  currentStep: number;
  totalSteps: number;
  stepperLabel: string;
  loading: boolean;
  areAllActionsCompleted: boolean;
  actionCompletionById: Partial<Record<PostOnboardingActionId, boolean>>;
};

export function usePostOnboardingHubStepperDisplay(
  actionsState: (PostOnboardingAction & PostOnboardingActionState)[],
): PostOnboardingHubStepperDisplay {
  const context = usePostOnboardingHubCompletionContext();
  const [actionCompletions, setActionCompletions] = useState<
    PostOnboardingHubActionCompletion[] | undefined
  >();

  useEffect(() => {
    let cancelled = false;
    setActionCompletions(undefined);

    const run = async () => {
      const completions = await getPostOnboardingActionsCompletion(actionsState, context);
      if (!cancelled) setActionCompletions(completions);
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [actionsState, context]);

  return useMemo(() => {
    const actionStateTotal = actionsState.length;
    const fulfilled = actionCompletions?.filter(action => action.countsAsFulfilled).length ?? 0;
    const totalSteps = 1 + Math.max(actionStateTotal, 1);
    const step = fulfilled + 1;
    const actionCompletionById = actionCompletions?.reduce<
      Partial<Record<PostOnboardingActionId, boolean>>
    >((acc, action) => {
      acc[action.id] = action.isActionCompleted;
      return acc;
    }, {});

    return {
      totalSteps,
      stepperLabel: `${step}/${totalSteps}`,
      areAllActionsCompleted: actionStateTotal > 0 && fulfilled === actionStateTotal,
      currentStep: step,
      loading: actionCompletions === undefined,
      actionCompletionById: actionCompletionById ?? {},
    };
  }, [actionsState, actionCompletions]);
}
