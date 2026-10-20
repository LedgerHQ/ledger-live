import type { TransportIdentifier } from "@ledgerhq/device-management-kit";
import { rnHidTransportIdentifier } from "@ledgerhq/live-dmk-mobile";

export type DeviceTransport = "bluetooth" | "usb";

/** Selects the wording for a device: a USB device is connected, a Bluetooth device is paired. */
export function getDeviceTransport(transport: TransportIdentifier): DeviceTransport {
  return transport === rnHidTransportIdentifier ? "usb" : "bluetooth";
}
