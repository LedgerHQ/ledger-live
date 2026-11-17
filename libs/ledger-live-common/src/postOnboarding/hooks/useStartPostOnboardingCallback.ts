import { useDispatch, useStore } from "react-redux";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { PostOnboardingActionId, PostOnboardingState } from "@ledgerhq/types-live";
import { usePostOnboardingContext } from "./usePostOnboardingContext";
import { useCallback } from "react";
import { useFeatureFlags } from "@features/platform-feature-flags";
import { initPostOnboarding, postOnboardingSetFinished } from "../actions";
import { postOnboardingHubActionIds } from "../logic/postOnboardingHubActionIds";

const emptyQueue = {
  actionsToComplete: [],
  actionsCompleted: {},
} as const satisfies Pick<PostOnboardingState, "actionsToComplete" | "actionsCompleted">;

function isActionId(value: unknown): value is PostOnboardingActionId {
  return (
    typeof value === "string" && Object.values(PostOnboardingActionId).some(id => id === value)
  );
}

function queuedPostOnboarding(
  state: unknown,
): Pick<PostOnboardingState, "actionsToComplete" | "actionsCompleted"> {
  if (typeof state !== "object" || state === null || !("postOnboarding" in state)) {
    return emptyQueue;
  }
  const slice: unknown = state.postOnboarding;
  if (typeof slice !== "object" || slice === null) return emptyQueue;
  if (!("actionsToComplete" in slice) || !("actionsCompleted" in slice)) return emptyQueue;

  const actionsToComplete: unknown = slice.actionsToComplete;
  const actionsCompleted: unknown = slice.actionsCompleted;
  if (!Array.isArray(actionsToComplete)) return emptyQueue;
  if (typeof actionsCompleted !== "object" || actionsCompleted === null) return emptyQueue;

  const completedEntries = Object.entries(actionsCompleted);
  if (
    !actionsToComplete.every(isActionId) ||
    !completedEntries.every(([id, completed]) => isActionId(id) && typeof completed === "boolean")
  ) {
    return emptyQueue;
  }

  return {
    actionsToComplete,
    actionsCompleted: Object.fromEntries(completedEntries),
  };
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
      const queued = queuedPostOnboarding(store.getState());
      const actionsIds = postOnboardingHubActionIds({
        actions: getPostOnboardingActionsForDevice(deviceModelId, mock),
        isFlagEnabled: featureFlagId => Boolean(flags[featureFlagId]?.enabled),
        canShowRecover: Boolean(options.canShowRecover),
        queuedActionIds: queued.actionsToComplete,
        completedActionIds: queued.actionsCompleted,
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
