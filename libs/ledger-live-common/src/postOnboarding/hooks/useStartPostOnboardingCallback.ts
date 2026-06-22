import { useDispatch } from "react-redux";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { usePostOnboardingContext } from "./usePostOnboardingContext";
import { useCallback } from "react";
import { useFeatureFlags } from "@features/platform-feature-flags";
import { initPostOnboarding, postOnboardingSetFinished } from "../actions";
import { PostOnboardingActionId } from "@ledgerhq/types-live";

type StartPostOnboardingOptions = {
  deviceModelId: DeviceModelId;
  mock?: boolean;
  fallbackIfNoAction?: () => void;
  resetNavigationStack?: boolean;
  canShowRecover?: boolean;
};

/**
 * Use this to initialize AND navigate to the post onboarding hub for a given
 * device model.
 *
 * @param deviceModelId
 * @returns a function that can be called to initialize the post
 * onboarding for the given device model and navigate to the post onboarding
 * hub.
 * TODO: unit test this
 */
export function useStartPostOnboardingCallback(): (options: StartPostOnboardingOptions) => void {
  const dispatch = useDispatch();
  const flags = useFeatureFlags();
  const { getPostOnboardingActionsForDevice, navigateToPostOnboardingHub } =
    usePostOnboardingContext();

  return useCallback(
    (options: StartPostOnboardingOptions) => {
      const { deviceModelId, mock = false, fallbackIfNoAction, resetNavigationStack } = options;
      const actions = getPostOnboardingActionsForDevice(deviceModelId, mock).filter(
        actionWithState =>
          (!actionWithState.featureFlagId || flags[actionWithState.featureFlagId]?.enabled) &&
          (actionWithState.id !== PostOnboardingActionId.recover || options.canShowRecover),
      );
      dispatch(
        initPostOnboarding({
          deviceModelId,
          actionsIds: actions.map(action => action.id),
        }),
      );

      if (actions.length === 0) {
        dispatch(postOnboardingSetFinished());
        if (fallbackIfNoAction) fallbackIfNoAction();
        return;
      }
      navigateToPostOnboardingHub(resetNavigationStack);
    },
    [dispatch, flags, getPostOnboardingActionsForDevice, navigateToPostOnboardingHub],
  );
}
