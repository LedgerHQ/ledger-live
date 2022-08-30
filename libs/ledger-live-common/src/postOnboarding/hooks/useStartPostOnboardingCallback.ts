import { useDispatch } from "react-redux";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { usePostOnboardingContext } from "./usePostOnboardingContext";
import { useCallback, useMemo } from "react";
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
export function useStartPostOnboardingCallback(
  deviceModelId: DeviceModelId,
  mock = false
): () => void {
  const dispatch = useDispatch();
  const { getPostOnboardingActionsForDevice, navigateToPostOnboardingHub } =
    usePostOnboardingContext();
  const actions = useMemo(
    () => getPostOnboardingActionsForDevice(deviceModelId, mock),
    [deviceModelId, mock, getPostOnboardingActionsForDevice]
  );
  return useCallback(() => {
    dispatch(
      initPostOnboarding({
        deviceModelId,
        actionsIds: actions.map((action) => action.id),
      })
    );
    if (actions.length === 0) return;
    navigateToPostOnboardingHub();
  }, [actions, deviceModelId, dispatch, navigateToPostOnboardingHub]);
}
