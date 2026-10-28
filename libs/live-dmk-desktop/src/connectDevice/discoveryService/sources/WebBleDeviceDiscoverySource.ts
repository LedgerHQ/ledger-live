import type { DeviceManagementKit } from "@ledgerhq/device-management-kit";

import { webBleTransportIdentifier } from "../../../bluetooth/bluetoothDevice";
import { TransportDeviceDiscoverySource } from "./TransportDeviceDiscoverySource";

export class WebBleDeviceDiscoverySource extends TransportDeviceDiscoverySource {
  constructor(dmk: DeviceManagementKit) {
    super(dmk, webBleTransportIdentifier);
  }
}
