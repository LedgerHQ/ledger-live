import { useCallback } from "react";
import { findMatchingDevice } from "@ledgerhq/live-dmk-mobile";
import type { Device } from "@ledgerhq/live-dmk-shared";
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
