import { usePostOnboardingHubState } from "./usePostOnboardingHubState";

/**
 *
 * @returns a boolean representing whether all the post onboarding actions have
 * been completed.
 * TODO: unit test this
 */
export function useAllPostOnboardingActionsCompleted(): boolean {
  const { actionsState } = usePostOnboardingHubState();
  return actionsState.every((action) => action.completed);
}
