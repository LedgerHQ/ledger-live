import { useMemo } from "react";
import { type PostOnboardingAction, type PostOnboardingActionState } from "@ledgerhq/types-live";
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
 */
export function usePostOnboardingFinishProgress(
  actionsState: (PostOnboardingAction & PostOnboardingActionState)[],
) {
  const { allActionsCompleted, completedActionsAmount, actionList, totalActionsAmount } = useMemo(
    () => {
      // 1. Drop buyCrypto. 2. Map to view-ready list items (see ./utils).
      // Stepper values add IMPLICIT_DEVICE_STEP_OFFSET for the view’s first hardcoded device row.
      const actionList: FinishPostOnboardingListItem[] = actionsState
        .filter(action => action.id !== EXCLUDED_FROM_FINISH_FLOW_ID)
        .map(toFinishPostOnboardingListItem);
      const completedInList = actionList.filter(a => a.completed).length;
      const totalInList = actionList.length;

      const allActionsCompleted = totalInList === 0 || completedInList === totalInList;

      return {
        allActionsCompleted,
        completedActionsAmount: completedInList + IMPLICIT_DEVICE_STEP_OFFSET,
        actionList,
        totalActionsAmount: totalInList + IMPLICIT_DEVICE_STEP_OFFSET,
      };
    },
    [actionsState],
  );

  return {
    allActionsCompleted,
    completedActionsAmount,
    actionList,
    totalActionsAmount,
  };
}
