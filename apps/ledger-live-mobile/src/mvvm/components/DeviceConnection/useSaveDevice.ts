import { useCallback } from "react";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import { mockserverIdentifier } from "@ledgerhq/live-dmk-mobile";
import type { KnownDevice } from "@ledgerhq/live-dmk-shared";
import { setHasConnectedDevice } from "~/actions/appstate";
import { addKnownBleDevice, updateKnownBleDevice } from "~/actions/ble";
import { setLastConnectedDevice } from "~/actions/settings";
import { useDispatch } from "~/context/hooks";
import { updateKnownDevice } from "~/reducers/knownDevices";

export type SaveDeviceOptions = {
  /**
   * A new device is added to the BLE known devices. A device the app already knows is only updated
   * there.
   */
  isNewDevice?: boolean;
};

export type SavedDevice = {
  /** Keeps the `usb|` and `mockserver|` ids of the legacy device actions. */
  lastConnectedDevice: Device;
  knownDevice: KnownDevice;
};

/**
 * Returns a callback that saves a device a connection flow connected to: it becomes the last
 * connected device and a known device, with the current time as its last use time.
 */
export function useSaveDevice({ isNewDevice = false }: SaveDeviceOptions = {}): (
  savedDevice: SavedDevice,
) => void {
  const dispatch = useDispatch();

  return useCallback(
    ({ lastConnectedDevice, knownDevice }: SavedDevice) => {
      dispatch(setLastConnectedDevice(lastConnectedDevice));

      dispatch(setHasConnectedDevice(true));

      dispatch(updateKnownDevice({ ...knownDevice, lastUsedAt: Date.now() }));

      if (!lastConnectedDevice.wired && knownDevice.transport !== mockserverIdentifier) {
        const bleDevice = {
          id: lastConnectedDevice.deviceId,
          name: lastConnectedDevice.deviceName ?? "",
          modelId: lastConnectedDevice.modelId,
        };
        dispatch(isNewDevice ? addKnownBleDevice(bleDevice) : updateKnownBleDevice(bleDevice));
      }
    },
    [dispatch, isNewDevice],
  );
}
