import { useSelector } from "react-redux";
import {
  postOnboardingDeviceModelIdSelector,
  walletPostOnboardingEntryPointDismissedSelector,
} from "../reducer";
import { useAllPostOnboardingActionsCompleted } from "./useAllPostOnboardingActionsCompleted";
import { usePostOnboardingHubState } from "./usePostOnboardingHubState";

/**
 *
 * @returns a boolean representing whether the post onboarding entry point
 * should be visible on the wallet page.
 */
export function usePostOnboardingEntryPointVisibleOnWallet(): boolean {
  const deviceModelId = useSelector(postOnboardingDeviceModelIdSelector);
  const dismissed = useSelector(walletPostOnboardingEntryPointDismissedSelector);
  const { actionsState } = usePostOnboardingHubState();
  const allCompleted = useAllPostOnboardingActionsCompleted();
  const allCompletedAndInitialized = actionsState.length > 0 && allCompleted;

  return Boolean(deviceModelId) && !dismissed && !allCompletedAndInitialized;
}
