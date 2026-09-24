import type { DeviceManagementKit } from "@ledgerhq/device-management-kit";
import { webHidIdentifier } from "@ledgerhq/device-transport-kit-web-hid";

import { TransportDeviceDiscoverySource } from "./TransportDeviceDiscoverySource";

export class WebHidDeviceDiscoverySource extends TransportDeviceDiscoverySource {
  constructor(dmk: DeviceManagementKit) {
    super(dmk, webHidIdentifier);
  }
}
