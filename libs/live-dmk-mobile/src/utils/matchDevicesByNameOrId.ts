import { DiscoveredDevice } from "@ledgerhq/device-management-kit";
import { DeviceModelId } from "@ledgerhq/types-devices";

/**
 * In this file, we define the rules to establish a match between a known device and a scanned device.
 *
 * These rules are required because of an OS update that will:
 * - change the BLE address of the device.
 * - change the default name advertised by the device. It will no longer be "Ledger (...) ABCD" but only "ABCD".
 *
 * The first change means that we cannot anymore rely solely only on deviceId (which is the BLE address) because it will change.
 * So we also try to match the device name.
 *
 * So for instance, we will try to match
 * - an "old" device named "Ledger Nano X 123A" with a "new" device named "123A"
 * - an "old" device named "Custom Device Name" with a "new" device named "Custom Device Name"
 */

export type DeviceBaseInfo = {
  deviceId: string;
  deviceName?: string | null;
  modelId: DeviceModelId;
};

export function isFormattedAsOldDeviceDefaultBleName(name: string): boolean {
  /**
   * regex that matches any string like "Ledger ... ABCD" where ABCD is a 4 digits hex
   *
   * we keep it simple and don't check the model name because of potential exceptions, this should be good enough
   * */
  const regex = /^(Ledger|Nano) .* [0-9A-Fa-f]{4}$/;
  return regex.test(name);
}

export function isFormattedAsNewDeviceDefaultBleName(name: string): boolean {
  /** regex that matches any 4 digits hex */
  const regex = /^[0-9A-Fa-f]{4}$/;
  return regex.test(name);
}

export function matchDeviceByName({
  oldDevice,
  newDevice,
}: {
  oldDevice: { deviceName?: string | null };
  newDevice: { deviceName?: string | null };
}): boolean {
  const { deviceName: oldDeviceName } = oldDevice;
  const { deviceName: newDeviceName } = newDevice;

  if (!oldDeviceName || !newDeviceName) {
    return false;
  }
  if (oldDeviceName === newDeviceName) return true;

  if (
    isFormattedAsOldDeviceDefaultBleName(oldDeviceName) &&
    isFormattedAsNewDeviceDefaultBleName(newDeviceName)
  ) {
    return oldDeviceName.endsWith(newDeviceName);
  }
  return false;
}

export function matchDeviceByDeviceId({
  deviceA,
  deviceB,
}: {
  deviceA: DeviceBaseInfo;
  deviceB: DeviceBaseInfo;
}): boolean {
  return deviceA.deviceId === deviceB.deviceId;
}

export function isMatchingDeviceModel(deviceA: DeviceBaseInfo, deviceB: DeviceBaseInfo): boolean {
  return deviceA.modelId === deviceB.modelId;
}

/**
 * For a given old device, find the matching new device index in the list of new devices.
 * First try to find a matching device by deviceId, then if not found, try to find a matching device by name.
 * Returns the index of the matching device, or -1 if no match is found.
 */
export function findMatchingNewDeviceIndex(
  oldDevice: DeviceBaseInfo,
  newDevices: DeviceBaseInfo[],
): number {
  const byId = newDevices.findIndex(
    newDevice =>
      isMatchingDeviceModel(oldDevice, newDevice) &&
      matchDeviceByDeviceId({ deviceA: oldDevice, deviceB: newDevice }),
  );
  if (byId !== -1) return byId;

  return newDevices.findIndex(
    newDevice =>
      isMatchingDeviceModel(oldDevice, newDevice) && matchDeviceByName({ oldDevice, newDevice }),
  );
}

/**
 * For a given old device, find the matching new device in the list of new devices.
 * First try to find a matching device by deviceId, then if not found, try to find a matching device by name.
 */
export function findMatchingNewDevice<T extends DeviceBaseInfo>(
  oldDevice: DeviceBaseInfo,
  newDevices: Array<T>,
): T | null {
  const index = findMatchingNewDeviceIndex(oldDevice, newDevices);
  return index !== -1 ? newDevices[index] : null;
}

/**
 * For a given new device, find the matching old device in the list of old devices.
 * First try to find a matching device by deviceId, then if not found, try to find a matching device by name.
 */
export function findMatchingOldDevice(
  newDevice: DeviceBaseInfo,
  oldDevices: DeviceBaseInfo[],
): DeviceBaseInfo | null {
  return (
    oldDevices.find(
      oldDevice =>
        isMatchingDeviceModel(newDevice, oldDevice) &&
        matchDeviceByDeviceId({ deviceA: newDevice, deviceB: oldDevice }),
    ) ??
    oldDevices.find(
      oldDevice =>
        isMatchingDeviceModel(newDevice, oldDevice) && matchDeviceByName({ oldDevice, newDevice }),
    ) ??
    null
  );
}

export const findMatchingDiscoveredDevice = (
  deviceId: string,
  deviceName: string | undefined,
  discoveredDevices: DiscoveredDevice[],
): DiscoveredDevice | null => {
  let matchByName: DiscoveredDevice | null = null;
  for (const discoveredDevice of discoveredDevices) {
    if (discoveredDevice.id === deviceId) {
      return discoveredDevice;
    }
    if (
      !matchByName &&
      deviceName &&
      matchDeviceByName({
        oldDevice: { deviceName },
        newDevice: { deviceName: discoveredDevice.name },
      })
    ) {
      matchByName = discoveredDevice;
    }
  }
  return matchByName;
};
