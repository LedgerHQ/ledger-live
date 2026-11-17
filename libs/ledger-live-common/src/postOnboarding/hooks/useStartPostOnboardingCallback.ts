import { useDispatch, useStore } from "react-redux";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { PostOnboardingState } from "@ledgerhq/types-live";
import { usePostOnboardingContext } from "./usePostOnboardingContext";
import { useCallback } from "react";
import { useFeatureFlags } from "@features/platform-feature-flags";
import { initPostOnboarding, postOnboardingSetFinished } from "../actions";
import { postOnboardingHubActionIds } from "../logic/postOnboardingHubActionIds";

type PostOnboardingRootState = { postOnboarding: PostOnboardingState };

// The app store always has this slice; the check only narrows the untyped store state.
function hasPostOnboardingSlice(state: unknown): state is PostOnboardingRootState {
  return typeof state === "object" && state !== null && "postOnboarding" in state;
}

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
  const store = useStore();
  const flags = useFeatureFlags();
  const { getPostOnboardingActionsForDevice, navigateToPostOnboardingHub } =
    usePostOnboardingContext();

  return useCallback(
    (options: StartPostOnboardingOptions) => {
      const { deviceModelId, mock = false, fallbackIfNoAction, resetNavigationStack } = options;
      const state = store.getState();
      const queue = hasPostOnboardingSlice(state) ? state.postOnboarding : null;
      const actionsIds = postOnboardingHubActionIds({
        actions: getPostOnboardingActionsForDevice(deviceModelId, mock),
        isFlagEnabled: featureFlagId => Boolean(flags[featureFlagId]?.enabled),
        canShowRecover: Boolean(options.canShowRecover),
        queuedActionIds: queue?.actionsToComplete ?? [],
        completedActionIds: queue?.actionsCompleted ?? {},
      });
      dispatch(
        initPostOnboarding({
          deviceModelId,
          actionsIds,
        }),
      );

      if (actionsIds.length === 0) {
        dispatch(postOnboardingSetFinished());
        if (fallbackIfNoAction) fallbackIfNoAction();
        return;
      }
      navigateToPostOnboardingHub(resetNavigationStack);
    },
    [dispatch, flags, getPostOnboardingActionsForDevice, navigateToPostOnboardingHub, store],
  );
}
