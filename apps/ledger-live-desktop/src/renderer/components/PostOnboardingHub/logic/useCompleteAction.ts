import { useCallback } from "react";
import { useDispatch } from "react-redux";
import { PostOnboardingActionId } from "@ledgerhq/types-live";
import { setPostOnboardingActionCompleted } from "@ledgerhq/live-common/postOnboarding/actions";
import { usePostOnboardingHubState } from "@ledgerhq/live-common/postOnboarding/hooks/index";
import { track } from "~/renderer/analytics/segment";

export function useCompleteActionCallback() {
  const dispatch = useDispatch();
  const { deviceModelId } = usePostOnboardingHubState();

  return useCallback(
    (actionId: PostOnboardingActionId) => {
      dispatch(setPostOnboardingActionCompleted({ actionId }));
      track("User has completed a post-onboarding action", {
        action: actionId,
        deviceModelId,
      });
    },
    [dispatch, deviceModelId],
  );
}
