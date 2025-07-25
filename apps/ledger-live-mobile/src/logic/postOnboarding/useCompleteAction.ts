import { useCallback, useContext } from "react";
import { useDispatch } from "react-redux";
import { PostOnboardingContext } from "@ledgerhq/live-common/postOnboarding/PostOnboardingProvider";
import { PostOnboardingActionId } from "@ledgerhq/types-live";
import { setPostOnboardingActionCompleted } from "@ledgerhq/live-common/postOnboarding/actions";
import { useTranslation } from "react-i18next";
import { track } from "~/analytics";
import { usePostOnboardingHubState } from "@ledgerhq/live-common/postOnboarding/hooks/index";
import { pushToast } from "~/actions/toast";

export function useCompleteActionCallback() {
  const dispatch = useDispatch();
  const { getPostOnboardingAction } = useContext(PostOnboardingContext);
  const { deviceModelId } = usePostOnboardingHubState();
  const { t } = useTranslation();

  return useCallback(
    (actionId: PostOnboardingActionId) => {
      dispatch(setPostOnboardingActionCompleted({ actionId }));
      if (!getPostOnboardingAction) return;
      const action = getPostOnboardingAction(actionId);
      track("User has completed a post-onboarding action", {
        action: actionId,
        deviceModelId,
        flow: "post-onboarding",
      });
      if (!action?.actionCompletedPopupLabel) return;
      dispatch(
        pushToast({
          id: actionId,
          type: "success",
          icon: "success",
          title: t(action.actionCompletedPopupLabel),
        }),
      );
    },
    [dispatch, getPostOnboardingAction, t, deviceModelId],
  );
}
