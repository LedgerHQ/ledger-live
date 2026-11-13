import { useCallback } from "react";
import type { ConnectedDevice } from "@ledgerhq/device-management-kit";
import { mockserverIdentifier } from "@ledgerhq/live-dmk-mobile";
import { buildMockServerCompatDeviceId, dmkToLedgerDeviceIdMap } from "@ledgerhq/live-dmk-shared";
import { type SaveDeviceOptions, type SavedDevice, useSaveDevice } from "./useSaveDevice";

function mapConnectedDeviceToSavedDevice(connectedDevice: ConnectedDevice): SavedDevice {
  const deviceModelId = dmkToLedgerDeviceIdMap[connectedDevice.modelId];
  const isMockServerDevice = connectedDevice.transport === mockserverIdentifier;

  return {
    lastConnectedDevice: {
      deviceId: isMockServerDevice
        ? buildMockServerCompatDeviceId(connectedDevice.id)
        : connectedDevice.id,
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
export function useSaveConnectedDevice(
  options?: SaveDeviceOptions,
): (connectedDevice: ConnectedDevice) => void {
  const saveDevice = useSaveDevice(options);

  return useCallback(
    (connectedDevice: ConnectedDevice) =>
      saveDevice(mapConnectedDeviceToSavedDevice(connectedDevice)),
    [saveDevice],
  );
}
