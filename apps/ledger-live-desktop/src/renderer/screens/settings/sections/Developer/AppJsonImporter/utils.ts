import { DeviceModelId, getDeviceModel } from "@ledgerhq/devices";
import type { SettingsState } from "~/renderer/reducers/settings";

export function isDeviceModelId(value: unknown): value is DeviceModelId {
  return Object.values(DeviceModelId).some(id => id === value);
}

export function formatImportedLastSeenDevice(settings: SettingsState | undefined): string | null {
  const lastSeen = settings?.lastSeenDevice;
  if (!lastSeen?.modelId || !isDeviceModelId(lastSeen.modelId)) {
    return null;
  }
  const productName = getDeviceModel(lastSeen.modelId).productName;
  const fw = lastSeen.deviceInfo?.majMin || lastSeen.deviceInfo?.version || "";
  return fw ? `${productName} (${fw})` : productName;
}
