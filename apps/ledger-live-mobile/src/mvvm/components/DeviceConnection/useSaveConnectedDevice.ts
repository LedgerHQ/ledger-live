import { useCallback } from "react";
import type { ConnectedDevice } from "@ledgerhq/device-management-kit";
import { buildMobileCompatDeviceId } from "@ledgerhq/live-dmk-mobile";
import { connectedDeviceToDevice } from "@ledgerhq/live-dmk-shared";
import { type SavedDevice, useSaveDevice } from "./useSaveDevice";

function mapConnectedDeviceToSavedDevice(connectedDevice: ConnectedDevice): SavedDevice {
  const knownDevice = connectedDeviceToDevice(connectedDevice);

  return {
    lastConnectedDevice: {
      deviceId: buildMobileCompatDeviceId(connectedDevice),
      deviceName: connectedDevice.name,
      modelId: knownDevice.deviceModelId,
      wired: connectedDevice.type === "USB",
    },
    knownDevice,
  };
}

/** Returns a callback that saves the device of a DMK connection with `useSaveDevice`. */
export function useSaveConnectedDevice(): (connectedDevice: ConnectedDevice) => void {
  const saveDevice = useSaveDevice();

  return useCallback(
    (connectedDevice: ConnectedDevice) =>
      saveDevice(mapConnectedDeviceToSavedDevice(connectedDevice)),
    [saveDevice],
  );
}
