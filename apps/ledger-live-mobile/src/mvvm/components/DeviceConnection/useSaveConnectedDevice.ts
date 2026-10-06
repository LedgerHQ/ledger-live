import { useCallback } from "react";
import type { ConnectedDevice } from "@ledgerhq/device-management-kit";
import { dmkToLedgerDeviceIdMap } from "@ledgerhq/live-dmk-shared";
import { setHasConnectedDevice } from "~/actions/appstate";
import { updateKnownBleDevice } from "~/actions/ble";
import { setLastConnectedDevice } from "~/actions/settings";
import { useDispatch } from "~/context/hooks";
import { updateKnownDevice } from "~/reducers/knownDevices";

/**
 * Returns a callback that saves a device a connection flow connected to: it becomes the last
 * connected device and a known device.
 */
export function useSaveConnectedDevice(): (connectedDevice: ConnectedDevice) => void {
  const dispatch = useDispatch();

  return useCallback(
    (connectedDevice: ConnectedDevice) => {
      const modelId = dmkToLedgerDeviceIdMap[connectedDevice.modelId];
      const wired = connectedDevice.type === "USB";

      dispatch(
        setLastConnectedDevice({
          deviceId: connectedDevice.id,
          deviceName: connectedDevice.name,
          modelId,
          wired,
        }),
      );

      dispatch(setHasConnectedDevice(true));

      dispatch(
        updateKnownDevice({
          id: connectedDevice.id,
          name: connectedDevice.name,
          deviceModelId: modelId,
          transport: connectedDevice.transport,
        }),
      );

      if (!wired) {
        dispatch(
          updateKnownBleDevice({
            id: connectedDevice.id,
            name: connectedDevice.name,
            modelId,
          }),
        );
      }
    },
    [dispatch],
  );
}
