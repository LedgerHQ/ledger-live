import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { useSelector } from "react-redux";
import {
  hasBeenRedirectedToPostOnboardingSelector,
  hasBeenUpsoldProtectSelector,
  lastConnectedDeviceSelector,
} from "~/reducers/settings";

/**
 * Returns whether the user should be redirected to the Protect upsell or the post onboarding
 * */
export function useShouldRedirect(): {
  shouldRedirectToProtectUpsell: boolean;
  shouldRedirectToPostOnboarding: boolean;
} {
  const hasBeenUpsoldProtect = useSelector(hasBeenUpsoldProtectSelector);
  const hasRedirectedToPostOnboarding = useSelector(hasBeenRedirectedToPostOnboardingSelector);
  const recoverUpsellRedirection = useFeature("recoverUpsellRedirection");
  const lastConnectedDevice = useSelector(lastConnectedDeviceSelector);
  const eligibleDevicesForUpsell = recoverUpsellRedirection?.enabled
    ? [DeviceModelId.nanoX, DeviceModelId.stax, DeviceModelId.europa]
    : [DeviceModelId.nanoX];

  const eligibleForUpsell = lastConnectedDevice?.modelId
    ? eligibleDevicesForUpsell.includes(lastConnectedDevice.modelId)
    : false;

  const shouldRedirectToProtectUpsell = !hasBeenUpsoldProtect && eligibleForUpsell;

  const shouldRedirectToPostOnboarding =
    !shouldRedirectToProtectUpsell && !hasRedirectedToPostOnboarding;

  return {
    shouldRedirectToProtectUpsell,
    shouldRedirectToPostOnboarding,
  };
}
