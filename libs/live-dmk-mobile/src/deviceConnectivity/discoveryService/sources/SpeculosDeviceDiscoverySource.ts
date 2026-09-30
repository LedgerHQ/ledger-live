import type { DeviceManagementKit } from "@ledgerhq/device-management-kit";
import { speculosIdentifier } from "@ledgerhq/device-transport-kit-speculos";
import {
  listenToTransportDevices,
  type DeviceDiscoverySource,
  type DeviceDiscoverySourceEvent,
} from "@ledgerhq/live-dmk-shared";
import type { Observable } from "rxjs";
import type { MobileDiscoveryError } from "../../types";

type MobileDeviceDiscoverySource = DeviceDiscoverySource<MobileDiscoveryError>;
type MobileDeviceDiscoverySourceEvent = DeviceDiscoverySourceEvent<MobileDiscoveryError>;

export class SpeculosDeviceDiscoverySource implements MobileDeviceDiscoverySource {
  readonly transportId = speculosIdentifier;

  constructor(private readonly dmk: DeviceManagementKit) {}

  listen(): Observable<MobileDeviceDiscoverySourceEvent> {
    return listenToTransportDevices<MobileDiscoveryError>(this.dmk, this.transportId);
  }
}
