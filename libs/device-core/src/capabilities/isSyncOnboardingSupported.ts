import { DeviceModelId } from "@ledgerhq/devices";

export function isSyncOnboardingSupported(deviceModelId: DeviceModelId) {
  return [DeviceModelId.stax, DeviceModelId.europa, DeviceModelId.apex].includes(deviceModelId);
}
