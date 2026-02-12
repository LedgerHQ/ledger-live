import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { useEffect, useRef } from "react";
import { HIDDiscoveredDevice, findMatchingNewDevice } from "@ledgerhq/live-dmk-mobile";
import { DisplayedDevice } from "./DisplayedDevice";
import { mapHidDeviceToDisplayedAvailableDevice } from "./mappers";

export type Props = {
  enabled: boolean;
  deviceToAutoSelect: Device | null;
  hidDevices: HIDDiscoveredDevice[];
  onAutoSelect: (device: DisplayedDevice) => void;
  usbDeviceToSelectExpirationDuration: number;
};

/**
 * Hook that automatically triggers device selection for the last connected device at mount time.
 * Auto selection can only happen once per mount. Subsequent prop changes are ignored.
 *
 * The behavior differs between USB and BLE devices:
 *
 * **USB**: Waits for a matching device to appear in `hidDevices` within
 * `usbDeviceToSelectExpirationDuration` ms. Calls `onAutoSelect` with a fully resolved
 * `DisplayedAvailableDevice` (including `discoveredDevice`), so the caller can proceed
 * directly to device status checks.
 *
 * **BLE**: Fires `onAutoSelect` immediately with `available: false`. This kicks off the
 * BLE requirements flow (permissions, Bluetooth on, etc.) in the parent component right away,
 * giving the user immediate visual feedback. The parent component is then responsible for
 * waiting until the device appears in BLE scan results before proceeding to connection.
 * This avoids a dead gap where scanning hasn't picked up the device yet but nothing is shown.
 */
export function useAutoSelectDevice({
  deviceToAutoSelect,
  hidDevices,
  onAutoSelect,
  usbDeviceToSelectExpirationDuration,
  enabled,
}: Props) {
  const autoSelectionInitializedRef = useRef(false);
  const autoSelectionDoneRef = useRef(false);
  const deviceToAutoSelectRef = useRef<Device | null>(null);
  const usbAutoSelectStartTimeRef = useRef<Date | null>(null);

  // Init effect: capture deviceToAutoSelect on first enabled mount (runs once).
  // For BLE, fires onAutoSelect immediately with available: false to start the BLE flow.
  useEffect(() => {
    if (!enabled) return;
    if (autoSelectionInitializedRef.current) return;
    autoSelectionInitializedRef.current = true;

    if (!deviceToAutoSelect) {
      autoSelectionDoneRef.current = true;
      return;
    }

    deviceToAutoSelectRef.current = deviceToAutoSelect;

    if (deviceToAutoSelect.wired) {
      // USB: record start time, the USB effect below will resolve the match.
      usbAutoSelectStartTimeRef.current = new Date();
    } else {
      // BLE: fire immediately so the parent can start BLE requirements checks
      // and show connecting UI. The parent's existing BLE flow will wait for the
      // device to appear in scan results before proceeding to connection.
      autoSelectionDoneRef.current = true;
      onAutoSelect({ device: deviceToAutoSelect, available: false });
    }
  }, [enabled, deviceToAutoSelect, onAutoSelect]);

  // USB auto-selection: wait for a matching HID device within timeout
  useEffect(() => {
    if (autoSelectionDoneRef.current) return;
    const target = deviceToAutoSelectRef.current;
    if (!target || !target.wired) return;
    if (!usbAutoSelectStartTimeRef.current) return;
    if (hidDevices.length === 0) return;

    const timeElapsed = Date.now() - usbAutoSelectStartTimeRef.current.getTime();
    if (timeElapsed > usbDeviceToSelectExpirationDuration) return;

    const match = findMatchingNewDevice(target, hidDevices);
    if (match) {
      autoSelectionDoneRef.current = true;
      onAutoSelect(mapHidDeviceToDisplayedAvailableDevice(match));
    }
  }, [hidDevices, onAutoSelect, usbDeviceToSelectExpirationDuration]);
}
