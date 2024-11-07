import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { useSelector } from "react-redux";
import { shouldRedirectToPostOnboardingOrRecoverUpsell } from "@ledgerhq/live-common/postOnboarding/logic/shouldRedirectToPostOnboardingOrRecoverUpsell";
import { DeviceModelId } from "@ledgerhq/types-devices";
import {
  hasBeenRedirectedToPostOnboardingSelector,
  hasBeenUpsoldRecoverSelector,
  lastOnboardedDeviceSelector,
} from "~/renderer/reducers/settings";

/**
 * Returns whether the user should be redirected to the Protect upsell or the post onboarding
 * */
export function useShouldRedirect(): {
  shouldRedirectToRecoverUpsell: boolean;
  shouldRedirectToPostOnboarding: boolean;
} {
  const hasBeenUpsoldRecover = useSelector(hasBeenUpsoldRecoverSelector);
  const hasRedirectedToPostOnboarding = useSelector(hasBeenRedirectedToPostOnboardingSelector);
  const recoverUpsellRedirection = useFeature("recoverUpsellRedirection");
  const lastOnboardedDevice = useSelector(lastOnboardedDeviceSelector);
  return shouldRedirectToPostOnboardingOrRecoverUpsell({
    hasBeenUpsoldRecover,
    hasRedirectedToPostOnboarding,
    upsellForTouchScreenDevices: Boolean(recoverUpsellRedirection?.enabled),
    lastConnectedDevice: lastOnboardedDevice,
    supportedDeviceModels: [
      DeviceModelId.nanoSP,
      DeviceModelId.nanoX,
      DeviceModelId.stax,
      DeviceModelId.europa,
    ],
  });
}
