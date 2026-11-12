import { useSelector } from "~/context/hooks";
import { lastConnectedDeviceSelector } from "~/reducers/settings";
import { useShouldRedirect } from "./useShouldRedirect";

/**
 * Whether useAutoRedirectToPostOnboarding is about to send the user to the
 * post onboarding hub or to the Ledger Recover upsell.
 * */
export function useIsPostOnboardingRedirectPending(): boolean {
  const lastConnectedDevice = useSelector(lastConnectedDeviceSelector);
  const { shouldRedirectToRecoverUpsell, shouldRedirectToPostOnboarding } = useShouldRedirect();

  return shouldRedirectToRecoverUpsell || (shouldRedirectToPostOnboarding && !!lastConnectedDevice);
}
