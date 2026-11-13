import { DeviceModelId } from "@ledgerhq/device-management-kit";

const touchscreenModels = new Set<DeviceModelId>([
  DeviceModelId.STAX,
  DeviceModelId.FLEX,
  DeviceModelId.APEX,
]);

export function isTouchscreen(deviceModelId: DeviceModelId): boolean {
  return touchscreenModels.has(deviceModelId);
}
