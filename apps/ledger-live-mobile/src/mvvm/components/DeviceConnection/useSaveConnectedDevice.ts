import { useCallback } from "react";
import type { ConnectedDevice } from "@ledgerhq/device-management-kit";
import { buildMobileCompatDeviceId } from "@ledgerhq/live-dmk-mobile";
import { dmkToLedgerDeviceIdMap } from "@ledgerhq/live-dmk-shared";
import { type SavedDevice, useSaveDevice } from "./useSaveDevice";

function mapConnectedDeviceToSavedDevice(connectedDevice: ConnectedDevice): SavedDevice {
  const deviceModelId = dmkToLedgerDeviceIdMap[connectedDevice.modelId];

  return {
    lastConnectedDevice: {
      deviceId: buildMobileCompatDeviceId(connectedDevice),
      deviceName: connectedDevice.name,
      modelId: deviceModelId,
      wired: connectedDevice.type === "USB",
    },
    knownDevice: {
      id: connectedDevice.id,
      name: connectedDevice.name,
      deviceModelId,
      transport: connectedDevice.transport,
    },
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
