import { useSelector } from "react-redux";
import {
  postOnboardingDeviceModelIdSelector,
  walletPostOnboardingEntryPointDismissedSelector,
} from "../reducer";
import { useAllPostOnboardingActionsCompleted } from "./useAllPostOnboardingActionsCompleted";

/**
 *
 * @returns a boolean representing whether the post onboarding entry point
 * should be visible on the wallet page.
 */
export function usePostOnboardingEntryPointVisibleOnWallet(): boolean {
  const deviceModelId = useSelector(postOnboardingDeviceModelIdSelector);
  const dismissed = useSelector(
    walletPostOnboardingEntryPointDismissedSelector
  );
  const allCompleted = useAllPostOnboardingActionsCompleted();

  return !!deviceModelId && !(dismissed || allCompleted);
}
