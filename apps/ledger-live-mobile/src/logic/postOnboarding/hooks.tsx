import { useDispatch, useSelector } from "react-redux";
import { useCallback, useMemo } from "react";
import { useNavigation } from "@react-navigation/native";
import { DeviceModelId } from "@ledgerhq/devices/lib/index";
import {
  PostOnboardingActionId,
  PostOnboardingHubState,
} from "@ledgerhq/live-common/lib/postOnboarding/types";
import { getPostOnboardingActionsForDevice, postOnboardingActions } from ".";
import {
  hubStateSelector,
  walletPostOnboardingEntryPointVisibleSelector,
} from "../../reducers/postOnboarding";
import { getFeature } from "../../components/FirebaseFeatureFlags";
import {
  clearPostOnboardingLastActionCompleted,
  hidePostOnboardingWalletEntryPoint,
  initPostOnboarding,
  setPostOnboardingActionDone,
} from "../../actions/postOnboarding";
import { NavigatorName, ScreenName } from "../../const";

/*
 * post onboarding hub screen.
 * @returns an object representing the state that should be rendered on the
 *
 * */
export function usePostOnboardingHubState(): PostOnboardingHubState {
  const hubState = useSelector(hubStateSelector);
  return useMemo(() => {
    const actionsState = hubState.actionsToComplete
      .map(actionId => ({
        ...postOnboardingActions[actionId],
        completed: !!hubState.actionsCompleted[actionId],
      }))
      .filter(actionWithState => {
        if (actionWithState.featureFlagId)
          return getFeature(actionWithState.featureFlagId)?.enabled;
        return true;
      });
    const lastActionCompleted = hubState.lastActionCompleted
      ? postOnboardingActions[hubState.lastActionCompleted]
      : null;
    return {
      deviceModelId: hubState.deviceModelId,
      lastActionCompleted,
      actionsState,
    };
  }, [hubState]);
}

/**
 *
 * @returns a boolean representing whether the post onboarding entry point
 * should be visible on the wallet page.
 */
export function usePostOnboardingEntryPointVisibleOnWallet(): boolean {
  return useSelector(walletPostOnboardingEntryPointVisibleSelector);
}

/**
 *
 * @returns a callback function that can be called to navigate to the post
 * onboarding hub.
 */
export function useNavigateToPostOnboardingHubCallback() {
  const navigation = useNavigation();
  return useCallback(() => {
    navigation.navigate(NavigatorName.PostOnboarding, {
      screen: ScreenName.PostOnboardingHub,
    });
  }, [navigation]);
}

/**
 * Use this to initialize the post onboarding flow for a given
 * device model. NB: this does NOT navigate to the post onboarding hub.
 *
 * @param deviceModelId
 * @returns a callback function that can be called to initialize the post
 * onboarding for the given device model
 */
function useInitPostOnboardingStateCallback(deviceModelId: DeviceModelId) {
  const dispatch = useDispatch();
  const actions = getPostOnboardingActionsForDevice(deviceModelId);
  return useCallback(
    () =>
      dispatch(
        initPostOnboarding(
          deviceModelId,
          actions.map(action => action.id),
        ),
      ),
    [deviceModelId, dispatch, actions],
  );
}

/**
 * Use this to initialize AND navigate to the post onboarding hub for a given
 * device model.
 *
 * @param deviceModelId
 * @returns a callback function that can be called to initialize the post
 * onboarding for the given device model and navigate to the post onboarding
 * hub.
 */
export function useStartPostOnboardingCallback(deviceModelId: DeviceModelId) {
  const initPostOnboardingState = useInitPostOnboardingStateCallback(
    deviceModelId,
  );
  const navigateToPostOnboardingHub = useNavigateToPostOnboardingHubCallback();
  return useCallback(() => {
    initPostOnboardingState();
    navigateToPostOnboardingHub();
  }, [initPostOnboardingState, navigateToPostOnboardingHub]);
}

export function useSetActionDoneCallback() {
  const dispatch = useDispatch();
  return useCallback(
    (actionId: PostOnboardingActionId) =>
      dispatch(setPostOnboardingActionDone(actionId)),
    [dispatch],
  );
}

export function useClearLastActionCompletedCallback() {
  const dispatch = useDispatch();
  return useCallback(() => {
    dispatch(clearPostOnboardingLastActionCompleted());
  }, [dispatch]);
}
