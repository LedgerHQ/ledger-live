import { Device } from "@ledgerhq/live-common/hw/actions/types";

/**
 * In this file, we define the rules to establish a match between a known device and a scanned device.
 *
 * These rules are required because of an OS update that will:
 * - change the BLE address of the device.
 * - change the default name advertised by the device. It will no longer be "Ledger (...) ABCD" but only "ABCD".
 *
 * The first change means that we cannot anymore rely solely only on deviceId (which is the BLE address) because it will change.
 * So we also try to match the device name.
 */

export function isFormattedAsOldDeviceDefaultBleName(name: string): boolean {
  /**
   * regex that matches any string like "Ledger ... ABCD" where ABCD is a 4 digits hex
   *
   * we keep it simple and don't check the model name because of potential exceptions, this should be good enough
   * */
  const regex = /^Ledger .* [0-9A-Fa-f]{4}$/;
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
  oldDevice: Device;
  newDevice: Device;
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
  deviceA: Device;
  deviceB: Device;
}): boolean {
  return deviceA.deviceId === deviceB.deviceId;
}

export function isMatchingDeviceModel(deviceA: Device, deviceB: Device): boolean {
  return deviceA.modelId === deviceB.modelId;
}

/**
 * For a given old device, find the matching new device in the list of new devices.
 * First try to find a matching device by deviceId, then if not found, try to find a matching device by name.
 */
export function findMatchingNewDevice(oldDevice: Device, newDevices: Device[]): Device | null {
  return (
    newDevices.find(
      newDevice =>
        isMatchingDeviceModel(oldDevice, newDevice) &&
        matchDeviceByDeviceId({ deviceA: oldDevice, deviceB: newDevice }),
    ) ??
    newDevices.find(
      newDevice =>
        isMatchingDeviceModel(oldDevice, newDevice) &&
        matchDeviceByName({ oldDevice, newDevice: newDevice }),
    ) ??
    null
  );
}

/**
 * For a given new device, find the matching old device in the list of old devices.
 * First try to find a matching device by deviceId, then if not found, try to find a matching device by name.
 */
export function findMatchingOldDevice(newDevice: Device, oldDevices: Device[]): Device | null {
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
