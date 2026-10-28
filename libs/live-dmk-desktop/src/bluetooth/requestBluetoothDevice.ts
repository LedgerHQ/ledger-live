import { firstValueFrom } from "rxjs";
import type { DeviceManagementKit, DiscoveredDevice } from "@ledgerhq/device-management-kit";
import { isDmkError } from "../errors";
import { webBleTransportIdentifier } from "./bluetoothDevice";

const toError = (error: unknown): Error => {
  if (error instanceof Error) return error;
  const message = isDmkError(error) ? (error.message ?? error._tag) : String(error);
  return new Error(message, { cause: error });
};

/**
 * Asks Web Bluetooth for a Ledger device; the user picks it in the app's device chooser.
 * Must run from a user gesture (Web Bluetooth requirement).
 *
 * Once discovered, the device is exposed by `listenToAvailableDevices` until it disconnects,
 * which feeds the regular device flow (`DeviceManagementKitTransport.listen` / `open`).
 * Always settles asynchronously: a DMK without the Bluetooth transport rejects instead of throwing.
 */
export const requestBluetoothDevice = async (
  dmk: DeviceManagementKit,
): Promise<DiscoveredDevice> => {
  try {
    return await firstValueFrom(dmk.startDiscovering({ transport: webBleTransportIdentifier }));
  } catch (error) {
    throw toError(error);
  }
};
