import { useSelector } from "react-redux";
import { useMemo } from "react";
import { PostOnboardingAction, PostOnboardingHubState } from "@ledgerhq/types-live";
import { FeatureFlagsContextValue, useFeatureFlags } from "../../featureFlags";
import { hubStateSelector } from "../reducer";
import { usePostOnboardingContext } from "./usePostOnboardingContext";

const getIsFeatureEnabled = (
  action: PostOnboardingAction | undefined,
  getFeature: FeatureFlagsContextValue["getFeature"],
) => {
  if (!action) return false;
  if (!action.featureFlagId) return true;

  const flag = getFeature(action.featureFlagId);
  if (!flag?.enabled) return false;

  return !action.featureFlagParamId || !!flag.params?.[action.featureFlagParamId];
};

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

    const actionsState = hubState.actionsToComplete.flatMap(actionId => {
      const action = getPostOnboardingAction(actionId);
      const isFeatureEnabled = getIsFeatureEnabled(action, getFeature);

      if (!action || !isFeatureEnabled) {
        return [];
      }
      return [{ ...action, completed: !!hubState.actionsCompleted[actionId] }];
    });
    const lastActionCompleted = hubState.lastActionCompleted
      ? getPostOnboardingAction(hubState.lastActionCompleted)
      : null;

    const isLastActionCompletedEnabled =
      lastActionCompleted && getIsFeatureEnabled(lastActionCompleted, getFeature);

    return {
      deviceModelId: hubState.deviceModelId,
      lastActionCompleted: isLastActionCompletedEnabled ? lastActionCompleted : null,
      actionsState,
      postOnboardingInProgress: hubState.postOnboardingInProgress,
    };
  }, [getFeature, hubState, getPostOnboardingAction]);
}
