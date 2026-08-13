import { DeviceModelId } from "@ledgerhq/devices";

const SYNC_ONBOARDING_SUPPORTED_DEVICE_MODELS = new Set<DeviceModelId>([
  DeviceModelId.stax,
  DeviceModelId.europa,
  DeviceModelId.apex,
]);

export function isSyncOnboardingSupported(deviceModelId: DeviceModelId) {
  return SYNC_ONBOARDING_SUPPORTED_DEVICE_MODELS.has(deviceModelId);
}
