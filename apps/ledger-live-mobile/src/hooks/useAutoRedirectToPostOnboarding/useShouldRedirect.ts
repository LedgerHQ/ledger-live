import { useSelector } from "react-redux";
import {
  hasBeenRedirectedToPostOnboardingSelector,
  hasBeenUpsoldProtectSelector,
  lastConnectedDeviceSelector,
} from "~/reducers/settings";
import { shouldRedirectToPostOnboardingOrRecoverUpsell } from "@ledgerhq/live-common/postOnboarding/logic/shouldRedirectToPostOnboardingOrRecoverUpsell";
import { DeviceModelId } from "@ledgerhq/types-devices";

/**
 * Returns whether the user should be redirected to the Protect upsell or the post onboarding
 * */
export function useShouldRedirect(): {
  shouldRedirectToRecoverUpsell: boolean;
  shouldRedirectToPostOnboarding: boolean;
} {
  const hasBeenUpsoldRecover = useSelector(hasBeenUpsoldProtectSelector);
  const hasRedirectedToPostOnboarding = useSelector(hasBeenRedirectedToPostOnboardingSelector);
  const lastConnectedDevice = useSelector(lastConnectedDeviceSelector);
  return shouldRedirectToPostOnboardingOrRecoverUpsell({
    hasBeenUpsoldRecover,
    hasRedirectedToPostOnboarding,
    lastConnectedDevice,
    supportedDeviceModels: [DeviceModelId.nanoX, DeviceModelId.stax, DeviceModelId.europa],
  });
}
