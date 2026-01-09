import { useSelector } from "LLD/hooks/redux";
import { shouldRedirectToPostOnboardingOrRecoverUpsell } from "@ledgerhq/live-common/postOnboarding/logic/shouldRedirectToPostOnboardingOrRecoverUpsell";
import {
  hasBeenRedirectedToPostOnboardingSelector,
  hasBeenUpsoldRecoverSelector,
  lastOnboardedDeviceSelector,
} from "~/renderer/reducers/settings";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";

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

  const supportedDeviceModels =
    recoverUpsellFeature?.enabled && recoverUpsellFeature?.params?.deviceIds
      ? [...recoverUpsellFeature.params.deviceIds]
      : [];

  return shouldRedirectToPostOnboardingOrRecoverUpsell({
    hasBeenUpsoldRecover,
    hasRedirectedToPostOnboarding,
    lastConnectedDevice: lastOnboardedDevice,
    supportedDeviceModels,
  });
}
