import type { TransportIdentifier } from "@ledgerhq/device-management-kit";
import { rnBleTransportIdentifier, rnHidTransportIdentifier } from "@ledgerhq/live-dmk-mobile";

export type ScanningMode = "bluetooth" | "bluetoothAndUsb" | "usb";

/**
 * Selects the copy and the animation of the Discovering view. Other transports, such as Speculos,
 * do not change it.
 */
export function getScanningMode(scanningTransports: TransportIdentifier[]): ScanningMode {
  const isScanningBluetooth = scanningTransports.includes(rnBleTransportIdentifier);
  const isScanningUsb = scanningTransports.includes(rnHidTransportIdentifier);

  if (isScanningBluetooth && isScanningUsb) return "bluetoothAndUsb";
  if (isScanningUsb) return "usb";
  return "bluetooth";
}
