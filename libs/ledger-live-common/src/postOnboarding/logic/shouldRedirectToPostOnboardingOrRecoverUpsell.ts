import { Device } from "@ledgerhq/hw-transport";
import { DeviceModelId } from "@ledgerhq/types-devices";

export function shouldRedirectToPostOnboardingOrRecoverUpsell({
  hasBeenUpsoldRecover,
  hasRedirectedToPostOnboarding,
  upsellForTouchScreenDevices,
  lastConnectedDevice,
  supportedDeviceModels,
}: {
  hasBeenUpsoldRecover: boolean;
  hasRedirectedToPostOnboarding: boolean;
  upsellForTouchScreenDevices: boolean;
  lastConnectedDevice: Device;
  supportedDeviceModels: DeviceModelId[];
}): {
  shouldRedirectToRecoverUpsell: boolean;
  shouldRedirectToPostOnboarding: boolean;
} {
  const eligibleDevicesForUpsell = upsellForTouchScreenDevices
    ? supportedDeviceModels
    : supportedDeviceModels.filter(
        model => ![DeviceModelId.europa, DeviceModelId.stax].includes(model),
      );

  const eligibleForUpsell = lastConnectedDevice?.modelId
    ? eligibleDevicesForUpsell.includes(lastConnectedDevice.modelId)
    : false;

  const shouldRedirectToRecoverUpsell = !hasBeenUpsoldRecover && eligibleForUpsell;

  const shouldRedirectToPostOnboarding =
    !shouldRedirectToRecoverUpsell && !hasRedirectedToPostOnboarding;

  return {
    shouldRedirectToRecoverUpsell,
    shouldRedirectToPostOnboarding,
  };
}
