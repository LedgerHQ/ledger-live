import type {
  ConnectedDevice,
  ConnectionType,
  DeviceManagementKit,
} from "@ledgerhq/device-management-kit";

const WIRED: ConnectionType = "USB";
const WIRELESS: ConnectionType = "BLE";

const LAST_CONNECTED_DEVICE_INDEX = -1;

/** The most recent DMK session opened over the given connection, if any. */
export function findLastConnectedDevice(
  dmk: DeviceManagementKit,
  { wired }: Readonly<{ wired: boolean }>,
): ConnectedDevice | undefined {
  const connection = wired ? WIRED : WIRELESS;
  try {
    return dmk
      .listConnectedDevices()
      .filter(device => device.type === connection)
      .at(LAST_CONNECTED_DEVICE_INDEX);
  } catch {
    return undefined;
  }
}
