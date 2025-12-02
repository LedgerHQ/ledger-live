import { Device } from "@ledgerhq/live-common/hw/actions/types";
import { useEffect, useRef } from "react";

export type Props = {
  enabled: boolean;
  deviceToAutoSelect: Device | null;
  availableUSBDevice: Device | undefined;
  onAutoSelect: (device: Device) => void;
  usbDeviceToSelectExpirationDuration: number;
};

/**
 * Hook that will automatically call onSelect with the deviceToAutoSelect, but only for the deviceToAutoSelect defined at first mount, and under some conditions.
 * - If the deviceToAutoSelect is a USB device, it will wait for the device to be available for usbDeviceToSelectExpirationDuration milliseconds, and then call onSelect with the deviceToAutoSelect.
 * - If the deviceToAutoSelect is a BLE device, it will call onSelect with the deviceToAutoSelect immediately.
 *
 * If the props are changed, nothing will happen, auto selection can only happen at mount time.
 */
export function useAutoSelectDevice({
  deviceToAutoSelect,
  availableUSBDevice,
  onAutoSelect,
  usbDeviceToSelectExpirationDuration,
  enabled,
}: Props) {
  const autoSelectionStartedRef = useRef(false);
  const usbDeviceToAutoSelectRef = useRef<{ device: Device; autoSelectStartTime: Date }>();

  useEffect(() => {
    if (!enabled) return;
    if (autoSelectionStartedRef.current) return;
    autoSelectionStartedRef.current = true;
    if (!deviceToAutoSelect) return;

    if (deviceToAutoSelect.wired) {
      // USB device: wait for the device to be available
      usbDeviceToAutoSelectRef.current = {
        device: deviceToAutoSelect,
        autoSelectStartTime: new Date(),
      };
    } else {
      // BLE device: just auto select
      onAutoSelect(deviceToAutoSelect);
    }
  }, [deviceToAutoSelect, onAutoSelect, enabled]);

  // USB device auto selection
  useEffect(() => {
    if (!availableUSBDevice) return;
    if (!usbDeviceToAutoSelectRef.current) return;

    const timeElapsed = Date.now() - usbDeviceToAutoSelectRef.current.autoSelectStartTime.getTime();
    const expired = timeElapsed > usbDeviceToSelectExpirationDuration;

    if (
      availableUSBDevice.modelId === usbDeviceToAutoSelectRef.current.device.modelId &&
      !expired
    ) {
      onAutoSelect(usbDeviceToAutoSelectRef.current.device);
      usbDeviceToAutoSelectRef.current = undefined;
    }
  }, [
    availableUSBDevice,
    onAutoSelect,
    usbDeviceToAutoSelectRef,
    usbDeviceToSelectExpirationDuration,
  ]);
}
