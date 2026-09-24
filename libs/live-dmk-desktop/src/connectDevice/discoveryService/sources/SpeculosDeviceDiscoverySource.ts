import type { DeviceManagementKit } from "@ledgerhq/device-management-kit";
import { speculosIdentifier } from "@ledgerhq/device-transport-kit-speculos";

import { TransportDeviceDiscoverySource } from "./TransportDeviceDiscoverySource";

export class SpeculosDeviceDiscoverySource extends TransportDeviceDiscoverySource {
  constructor(dmk: DeviceManagementKit) {
    super(dmk, speculosIdentifier);
  }
}
