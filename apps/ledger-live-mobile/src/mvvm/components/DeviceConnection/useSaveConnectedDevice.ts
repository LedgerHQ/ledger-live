import { useCallback } from "react";
import type { ConnectedDevice } from "@ledgerhq/device-management-kit";
import { buildMobileCompatDeviceId } from "@ledgerhq/live-dmk-mobile";
import { dmkToLedgerDeviceIdMap, type KnownDevice } from "@ledgerhq/live-dmk-shared";
import { type SavedDevice, useSaveDevice } from "./useSaveDevice";

/** The known device that a DMK connection saves. */
export function mapConnectedDeviceToKnownDevice(connectedDevice: ConnectedDevice): KnownDevice {
  return {
    id: connectedDevice.id,
    name: connectedDevice.name,
    deviceModelId: dmkToLedgerDeviceIdMap[connectedDevice.modelId],
    transport: connectedDevice.transport,
  };
}

function mapConnectedDeviceToSavedDevice(connectedDevice: ConnectedDevice): SavedDevice {
  const knownDevice = mapConnectedDeviceToKnownDevice(connectedDevice);

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
