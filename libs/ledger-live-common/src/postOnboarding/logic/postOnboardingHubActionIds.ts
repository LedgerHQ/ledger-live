import { PostOnboardingAction, PostOnboardingActionId, type FeatureId } from "@ledgerhq/types-live";

type CompletedActions = { readonly [key in PostOnboardingActionId]?: boolean };

export function postOnboardingHubActionIds({
  actions,
  isFlagEnabled,
  canShowRecover,
  queuedActionIds,
  completedActionIds,
}: {
  actions: readonly PostOnboardingAction[];
  isFlagEnabled: (featureFlagId: FeatureId) => boolean;
  canShowRecover: boolean;
  queuedActionIds: readonly PostOnboardingActionId[];
  completedActionIds: CompletedActions;
}): PostOnboardingActionId[] {
  const enabledIds = actions.flatMap(action => {
    const flagAllowsAction = !action.featureFlagId || isFlagEnabled(action.featureFlagId);
    const recoverAllowsAction = action.id !== PostOnboardingActionId.recover || canShowRecover;
    return flagAllowsAction && recoverAllowsAction ? [action.id] : [];
  });

  const recoverWasDeferred =
    queuedActionIds.includes(PostOnboardingActionId.recover) &&
    completedActionIds[PostOnboardingActionId.recover] !== true;

  if (recoverWasDeferred && !enabledIds.includes(PostOnboardingActionId.recover)) {
    return [...enabledIds, PostOnboardingActionId.recover];
  }

  return enabledIds;
}
