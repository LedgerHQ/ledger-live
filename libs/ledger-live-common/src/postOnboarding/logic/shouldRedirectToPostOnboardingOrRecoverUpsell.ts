import { Device } from "@ledgerhq/hw-transport";
import { DeviceModelId } from "@ledgerhq/types-devices";

export function shouldRedirectToPostOnboardingOrRecoverUpsell({
  hasBeenUpsoldRecover,
  hasRedirectedToPostOnboarding,
  lastConnectedDevice,
  supportedDeviceModels,
}: {
  hasBeenUpsoldRecover: boolean;
  hasRedirectedToPostOnboarding: boolean;
  lastConnectedDevice: Device;
  supportedDeviceModels: DeviceModelId[];
}): {
  shouldRedirectToRecoverUpsell: boolean;
  shouldRedirectToPostOnboarding: boolean;
} {
  const eligibleForUpsell = lastConnectedDevice?.modelId
    ? supportedDeviceModels.includes(lastConnectedDevice.modelId)
    : false;

  const shouldRedirectToRecoverUpsell = !hasBeenUpsoldRecover && eligibleForUpsell;

  const shouldRedirectToPostOnboarding =
    !shouldRedirectToRecoverUpsell && !hasRedirectedToPostOnboarding;

  return {
    shouldRedirectToRecoverUpsell,
    shouldRedirectToPostOnboarding,
  };
}
