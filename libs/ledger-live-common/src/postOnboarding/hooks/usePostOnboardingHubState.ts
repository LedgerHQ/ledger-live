import { useSelector } from "react-redux";
import { useMemo } from "react";
import { PostOnboardingHubState } from "@ledgerhq/types-live";
import { useFeatureFlags } from "@ledgerhq/live-config/featureFlags/index";
import { hubStateSelector } from "../reducer";
import { usePostOnboardingContext } from "./usePostOnboardingContext";

/**
 * @returns an object representing the state that should be rendered on the post
 * onboarding hub screen.
 *
 * This takes feature flagging into account so the logic is
 * resistant to flags getting enabled/disabled over time (for a given disabled
 * feature flag, the actions pointing to it will be excluded).
 * */
export function usePostOnboardingHubState(): PostOnboardingHubState {
  const hubState = useSelector(hubStateSelector);
  const postOnboardingContext = usePostOnboardingContext();
  const { getPostOnboardingAction } = postOnboardingContext;
  const { getFeature } = useFeatureFlags();
  return useMemo(() => {
    if (!getPostOnboardingAction)
      return {
        deviceModelId: hubState.deviceModelId,
        lastActionCompleted: null,
        actionsState: [],
        postOnboardingInProgress: hubState.postOnboardingInProgress,
      };
    const actionsState = hubState.actionsToComplete
      .map(actionId => ({
        ...getPostOnboardingAction(actionId),
        completed: !!hubState.actionsCompleted[actionId],
      }))
      .filter(
        actionWithState =>
          !actionWithState.featureFlagId || getFeature(actionWithState.featureFlagId)?.enabled,
      );
    const lastActionCompleted = hubState.lastActionCompleted
      ? getPostOnboardingAction(hubState.lastActionCompleted)
      : null;

    const isLastActionCompletedEnabled =
      lastActionCompleted &&
      (!lastActionCompleted.featureFlagId ||
        getFeature(lastActionCompleted.featureFlagId)?.enabled);

    return {
      deviceModelId: hubState.deviceModelId,
      lastActionCompleted: isLastActionCompletedEnabled ? lastActionCompleted : null,
      actionsState,
      postOnboardingInProgress: hubState.postOnboardingInProgress,
    };
  }, [getFeature, hubState, getPostOnboardingAction]);
}
