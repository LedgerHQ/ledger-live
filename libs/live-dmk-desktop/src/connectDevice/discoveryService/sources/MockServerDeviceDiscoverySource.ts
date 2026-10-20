import type { DeviceManagementKit } from "@ledgerhq/device-management-kit";
import { mockserverIdentifier } from "@ledgerhq/device-transport-kit-mockserver";

import { TransportDeviceDiscoverySource } from "./TransportDeviceDiscoverySource";

export class MockServerDeviceDiscoverySource extends TransportDeviceDiscoverySource {
  constructor(dmk: DeviceManagementKit) {
    super(dmk, mockserverIdentifier);
  }
}
