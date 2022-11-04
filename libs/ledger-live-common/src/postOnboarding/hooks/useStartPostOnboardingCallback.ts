import { useDispatch } from "react-redux";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { usePostOnboardingContext } from "./usePostOnboardingContext";
import { useCallback } from "react";
import { useFeatureFlags } from "../../featureFlags";
import { initPostOnboarding } from "../actions";

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
export function useStartPostOnboardingCallback(): (
  deviceModelId: DeviceModelId,
  mock?: boolean,
  fallbackIfNoAction?: () => void
) => void {
  const dispatch = useDispatch();
  const { getFeature } = useFeatureFlags();
  const { getPostOnboardingActionsForDevice, navigateToPostOnboardingHub } =
    usePostOnboardingContext();

  return useCallback(
    (
      deviceModelId: DeviceModelId,
      mock = false,
      fallbackIfNoAction?: () => void
    ) => {
      const actions = getPostOnboardingActionsForDevice(
        deviceModelId,
        mock
      ).filter(
        (actionWithState) =>
          !actionWithState.featureFlagId ||
          getFeature(actionWithState.featureFlagId)?.enabled
      );
      dispatch(
        initPostOnboarding({
          deviceModelId,
          actionsIds: actions.map((action) => action.id),
        })
      );

      if (actions.length === 0) {
        if (fallbackIfNoAction) {
          fallbackIfNoAction();
        }
        return;
      }
      navigateToPostOnboardingHub();
    },
    [
      dispatch,
      getFeature,
      getPostOnboardingActionsForDevice,
      navigateToPostOnboardingHub,
    ]
  );
}
