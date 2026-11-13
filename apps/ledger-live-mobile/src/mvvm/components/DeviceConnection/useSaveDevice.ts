import { useCallback } from "react";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import { rnBleTransportIdentifier } from "@ledgerhq/live-dmk-mobile";
import type { KnownDevice } from "@ledgerhq/live-dmk-shared";
import { setHasConnectedDevice } from "~/actions/appstate";
import { upsertKnownBleDevice } from "~/actions/ble";
import { setLastConnectedDevice } from "~/actions/settings";
import { useDispatch } from "~/context/hooks";
import { upsertKnownDevice } from "~/reducers/knownDevices";

export type SavedDevice = {
  /** Keeps the `usb|` and `mockserver|` ids of the legacy device actions. */
  lastConnectedDevice: Device;
  knownDevice: KnownDevice;
};

/**
 * Returns a callback that saves a device a connection flow connected to: it becomes the last
 * connected device and a known device, with the current time as its last use time.
 */
export function useSaveDevice(): (savedDevice: SavedDevice) => void {
  const dispatch = useDispatch();

  return useCallback(
    ({ lastConnectedDevice, knownDevice }: SavedDevice) => {
      dispatch(setLastConnectedDevice(lastConnectedDevice));

      dispatch(setHasConnectedDevice(true));

      dispatch(upsertKnownDevice({ ...knownDevice, lastUsedAt: Date.now() }));

      if (knownDevice.transport === rnBleTransportIdentifier) {
        const bleDevice = {
          id: lastConnectedDevice.deviceId,
          name: lastConnectedDevice.deviceName ?? "",
          modelId: lastConnectedDevice.modelId,
        };
        dispatch(upsertKnownBleDevice(bleDevice));
      }
    },
    [dispatch],
  );
}
