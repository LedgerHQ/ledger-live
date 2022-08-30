import { useSelector } from "react-redux";
import { walletPostOnboardingEntryPointDismissedSelector } from "../reducer";
import { useAllPostOnboardingActionsCompleted } from "./useAllPostOnboardingActionsCompleted";
import { usePostOnboardingDeviceModelId } from "./usePostOnboardingDeviceModelId";

/**
 *
 * @returns a boolean representing whether the post onboarding entry point
 * should be visible on the wallet page.
 * TODO: unit test this
 */
export function usePostOnboardingEntryPointVisibleOnWallet(): boolean {
  const dismissed = useSelector(
    walletPostOnboardingEntryPointDismissedSelector
  );
  const allCompleted = useAllPostOnboardingActionsCompleted();
  const deviceModelId = usePostOnboardingDeviceModelId();

  return !!deviceModelId && !(dismissed || allCompleted);
}
