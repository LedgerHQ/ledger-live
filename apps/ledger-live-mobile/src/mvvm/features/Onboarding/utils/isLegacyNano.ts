import { DeviceModelId } from "@ledgerhq/devices";

const LEGACY_NANO_DEVICE_MODEL_IDS = new Set<DeviceModelId>([
  DeviceModelId.nanoS,
  DeviceModelId.nanoSP,
  DeviceModelId.nanoX,
]);

export const isLegacyNano = (deviceModelId: DeviceModelId | null | undefined): boolean =>
  deviceModelId != null && LEGACY_NANO_DEVICE_MODEL_IDS.has(deviceModelId);
