import { useSelector } from "LLD/hooks/redux";
import { shouldRedirectToPostOnboardingOrRecoverUpsell } from "@ledgerhq/live-common/postOnboarding/logic/shouldRedirectToPostOnboardingOrRecoverUpsell";
import {
  hasBeenRedirectedToPostOnboardingSelector,
  hasBeenUpsoldRecoverSelector,
  lastOnboardedDeviceSelector,
} from "~/renderer/reducers/settings";
import type { DeviceModelId } from "@ledgerhq/types-devices";
import { useFeature } from "@features/platform-feature-flags";

/**
 * Returns whether the user should be redirected to the Protect upsell or the post onboarding
 * */
export function useShouldRedirect(): {
  shouldRedirectToRecoverUpsell: boolean;
  shouldRedirectToPostOnboarding: boolean;
} {
  const hasBeenUpsoldRecover = useSelector(hasBeenUpsoldRecoverSelector);
  const hasRedirectedToPostOnboarding = useSelector(hasBeenRedirectedToPostOnboardingSelector);
  const lastOnboardedDevice = useSelector(lastOnboardedDeviceSelector);
  const recoverUpsellFeature = useFeature("recoverUpsellPostOnboarding");

  const supportedDeviceModels: DeviceModelId[] =
    recoverUpsellFeature?.enabled && recoverUpsellFeature?.params?.deviceIds
      ? ([...recoverUpsellFeature.params.deviceIds] as DeviceModelId[])
      : [];

  return shouldRedirectToPostOnboardingOrRecoverUpsell({
    hasBeenUpsoldRecover,
    hasRedirectedToPostOnboarding,
    lastConnectedDevice: lastOnboardedDevice,
    supportedDeviceModels,
  });
}
