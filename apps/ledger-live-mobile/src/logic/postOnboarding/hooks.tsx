import { useDispatch, useSelector } from "react-redux";
import { useCallback, useMemo } from "react";
import { DeviceModelId } from "@ledgerhq/devices/lib/index";
import { getPostOnboardingActionsForDevice, postOnboardingActions } from ".";
import {
  hubStateSelector,
  walletPostOnboardingEntryPointVisibleSelector,
} from "../../reducers/postOnboarding";
import {
  ActionState,
  PostOnboardingAction,
  PostOnboardingActionId,
} from "./types";
import { getFeature } from "../../components/FirebaseFeatureFlags";
import {
  hidePostOnboardingWalletEntryPoint,
  initPostOnboarding,
  setPostOnboardingActionDone,
} from "../../actions/postOnboarding";
import { useNavigation } from "@react-navigation/native";
import { NavigatorName, ScreenName } from "../../const";

type PostOnboardingHubState = {
  deviceModelId: DeviceModelId | null;
  lastActionCompleted: PostOnboardingAction | null;
  actionsState: (PostOnboardingAction & ActionState)[];
};

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

export function usePostOnboardingEntryPointVisibleOnWallet(): boolean {
  return useSelector(walletPostOnboardingEntryPointVisibleSelector);
}

function useInitPostOnboardingState(deviceModelId: DeviceModelId) {
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

export function useInitPostOnboarding(deviceModelId: DeviceModelId) {
  const navigation = useNavigation();
  const initPostOnboardingState = useInitPostOnboardingState(deviceModelId);
  return useCallback(() => {
    initPostOnboardingState();
    navigation.navigate(NavigatorName.Base, {
      screenName: ScreenName.PostOnboardingHub,
    });
  }, [initPostOnboardingState, navigation]);
}

export function usePostOnboarding() {
  const dispatch = useDispatch();
  return useMemo(
    () => ({
      setActionDone: (actionId: PostOnboardingActionId) =>
        dispatch(setPostOnboardingActionDone(actionId)),
      hideWalletEntryPoint: () =>
        dispatch(hidePostOnboardingWalletEntryPoint()),
    }),
    [dispatch],
  );
}
