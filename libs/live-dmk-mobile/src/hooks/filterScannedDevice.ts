import { DeviceId } from "@ledgerhq/device-management-kit";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { ScannedDevice } from "./ScannedDevice";

/**
 * Filters a scanned device based on the provided filter options.
 * @param device - The scanned device to filter.
 * @param filterByDeviceModelIds - The device model IDs to filter by.
 * @param filterOutDevicesByDeviceIds - The device IDs to filter out.
 * @returns True if the device should be included in the filtered list, false otherwise.
 */
export function filterScannedDevice(
  device: ScannedDevice,
  {
    filterByDeviceModelIds,
    filterOutDevicesByDeviceIds,
  }: {
    filterByDeviceModelIds?: DeviceModelId[];
    filterOutDevicesByDeviceIds?: DeviceId[];
  },
): boolean {
  if (
    filterByDeviceModelIds &&
    filterByDeviceModelIds.length > 0 &&
    !filterByDeviceModelIds.includes(device.modelId)
  ) {
    return false;
  }
  if (
    filterOutDevicesByDeviceIds &&
    filterOutDevicesByDeviceIds.length > 0 &&
    filterOutDevicesByDeviceIds.includes(device.deviceId)
  ) {
    return false;
  }
  return true;
}
