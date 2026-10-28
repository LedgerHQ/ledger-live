import { webBleTransportFactory } from "@ledgerhq/device-transport-kit-web-ble";
import { withAvailabilityUntilDisconnect } from "./withAvailabilityUntilDisconnect";
import { withBluetoothActivity } from "./withBluetoothActivity";

export const bluetoothTransportFactory = withBluetoothActivity(
  withAvailabilityUntilDisconnect(webBleTransportFactory),
);
