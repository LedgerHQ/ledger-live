import { useSelector } from "~/context/hooks";
import {
  hasBeenRedirectedToPostOnboardingSelector,
  hasBeenUpsoldProtectSelector,
  lastConnectedDeviceSelector,
} from "~/reducers/settings";
import { shouldRedirectToPostOnboardingOrRecoverUpsell } from "@ledgerhq/live-common/postOnboarding/logic/shouldRedirectToPostOnboardingOrRecoverUpsell";
import { useFeature } from "@features/platform-feature-flags";
import type { DeviceModelId } from "@ledgerhq/types-devices";

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
  const recoverUpsellFeature = useFeature("recoverUpsellPostOnboarding");

  // Zod-derived `deviceIds` is `("blue" | "nanoS" | ...)[]` — same shape as DeviceModelId enum.
  const supportedDeviceModels: DeviceModelId[] =
    recoverUpsellFeature?.enabled && recoverUpsellFeature?.params?.deviceIds
      ? ([...recoverUpsellFeature.params.deviceIds] as DeviceModelId[])
      : [];

  return shouldRedirectToPostOnboardingOrRecoverUpsell({
    hasBeenUpsoldRecover,
    hasRedirectedToPostOnboarding,
    lastConnectedDevice,
    supportedDeviceModels,
  });
}
