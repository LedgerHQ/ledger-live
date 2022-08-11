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
  hidePostOnboardingWalletEntryPoint,
  initPostOnboarding,
  setPostOnboardingActionDone,
} from "../../actions/postOnboarding";
import { NavigatorName, ScreenName } from "../../const";

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

export function useNavigateToPostOnboardingHub() {
  const navigation = useNavigation();
  return useCallback(() => {
    navigation.navigate(NavigatorName.Base, {
      screen: ScreenName.PostOnboardingHub,
    });
  }, [navigation]);
}

export function useInitPostOnboarding(deviceModelId: DeviceModelId) {
  const initPostOnboardingState = useInitPostOnboardingState(deviceModelId);
  const navigateToPostOnboardingHub = useNavigateToPostOnboardingHub();
  return useCallback(() => {
    initPostOnboardingState();
    navigateToPostOnboardingHub();
  }, [initPostOnboardingState, navigateToPostOnboardingHub]);
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
