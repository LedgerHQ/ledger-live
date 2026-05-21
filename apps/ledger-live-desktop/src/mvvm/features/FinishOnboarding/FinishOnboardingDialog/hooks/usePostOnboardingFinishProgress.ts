import { useEffect, useMemo, useState } from "react";
import {
  type PostOnboardingAction,
  type PostOnboardingActionId,
  type PostOnboardingActionState,
} from "@ledgerhq/types-live";
import { isPostOnboardingHubActionFulfilled } from "~/renderer/components/PostOnboardingHub/logic/postOnboardingHubCompletion";
import { usePostOnboardingHubCompletionContext } from "~/renderer/components/PostOnboardingHub/logic/usePostOnboardingHubCompletionContext";
import {
  EXCLUDED_FROM_FINISH_FLOW_ID,
  IMPLICIT_DEVICE_STEP_OFFSET,
  toFinishPostOnboardingListItem,
  type FinishPostOnboardingListItem,
} from "./utils";

/**
 * Post-onboarding “finish setup” UIs use the same hub
 * `actionsState` with `EXCLUDED_FROM_FINISH_FLOW_ID` excluded.
 *
 * Stepper `completedActionsAmount` / `totalActionsAmount` add
 * `IMPLICIT_DEVICE_STEP_OFFSET` for the `deviceOnboarded` row that
 * `FinishOnboardingDialogView` hardcodes. `allActionsCompleted` still uses
 * the hub `actionList` only (no offset).
 *
 * Per-action completion is resolved via {@link isPostOnboardingHubActionFulfilled} so the
 * stepper reflects both the sync `getIsAlreadyCompletedByState` and the async
 * `getIsAlreadyCompleted` (e.g. Recover BACKUP_DONE), not just the redux `completed` flag.
 */
export function usePostOnboardingFinishProgress(
  actionsState: (PostOnboardingAction & PostOnboardingActionState)[],
) {
  const context = usePostOnboardingHubCompletionContext();

  const actionList = useMemo<FinishPostOnboardingListItem[]>(
    () =>
      actionsState
        .filter(action => action.id !== EXCLUDED_FROM_FINISH_FLOW_ID)
        .map(toFinishPostOnboardingListItem),
    [actionsState],
  );

  const [completionById, setCompletionById] = useState<
    Partial<Record<PostOnboardingActionId, boolean>>
  >({});

  useEffect(() => {
    let cancelled = false;
    Promise.all(
      actionList.map(async item => {
        const result = await isPostOnboardingHubActionFulfilled(item, context).catch(() => false);
        return [item.id, result] as const;
      }),
    ).then(entries => {
      if (cancelled) return;
      setCompletionById(
        entries.reduce<Partial<Record<PostOnboardingActionId, boolean>>>((acc, [id, done]) => {
          acc[id] = done;
          return acc;
        }, {}),
      );
    });
    return () => {
      cancelled = true;
    };
  }, [actionList, context]);

  return useMemo(() => {
    const completedInList = actionList.filter(
      a => a.completed || !!completionById[a.id],
    ).length;
    const totalInList = actionList.length;

    const allActionsCompleted = totalInList === 0 || completedInList === totalInList;

    return {
      allActionsCompleted,
      completedActionsAmount: completedInList + IMPLICIT_DEVICE_STEP_OFFSET,
      actionList,
      totalActionsAmount: totalInList + IMPLICIT_DEVICE_STEP_OFFSET,
      completionById,
    };
  }, [actionList, completionById]);
}
