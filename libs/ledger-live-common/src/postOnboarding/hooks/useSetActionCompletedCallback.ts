import { useDispatch } from "react-redux";
import { PostOnboardingActionId } from "@ledgerhq/types-live";
import { useCallback } from "react";
import { setPostOnboardingActionCompleted } from "../actions";

/**
 * @returns a function to signal the completion of an action of the post
 * onboarding.
 */
export function useSetActionCompletedCallback(): (
  actionId: PostOnboardingActionId
) => void {
  const dispatch = useDispatch();
  return useCallback(
    (actionId: PostOnboardingActionId) =>
      dispatch(setPostOnboardingActionCompleted({ actionId })),
    [dispatch]
  );
}
