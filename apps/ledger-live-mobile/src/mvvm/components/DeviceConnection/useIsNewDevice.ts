import { useCallback } from "react";
import type { ConnectedDevice } from "@ledgerhq/device-management-kit";
import { findMatchingDevice } from "@ledgerhq/live-dmk-mobile";
import { connectedDeviceToDevice, type Device } from "@ledgerhq/live-dmk-shared";
import { useSelector } from "~/context/hooks";
import { knownDevicesSelector } from "~/reducers/knownDevices";

/**
 * Returns whether a device is not in the known devices, with the matcher of the device list. A
 * known device that the user adds again is not new.
 */
export function useIsNewDevice(): (device: Device) => boolean {
  const knownDevices = useSelector(knownDevicesSelector);

  return useCallback(
    (device: Device) => findMatchingDevice(device, knownDevices) === null,
    [knownDevices],
  );
}

/**
 * `useIsNewDevice` for the device of a DMK connection, read as the device list reads it. Call it
 * before the device is saved: the save makes every device known.
 */
export function useIsNewConnectedDevice(): (connectedDevice: ConnectedDevice) => boolean {
  const isNewDevice = useIsNewDevice();

  return useCallback(
    (connectedDevice: ConnectedDevice) => isNewDevice(connectedDeviceToDevice(connectedDevice)),
    [isNewDevice],
  );
}
