import type { DeviceManagementKit } from "@ledgerhq/device-management-kit";
import { mockserverIdentifier } from "@ledgerhq/device-transport-kit-mockserver";
import {
  listenToTransportDevices,
  type DeviceDiscoverySource,
  type DeviceDiscoverySourceEvent,
} from "@ledgerhq/live-dmk-shared";
import type { Observable } from "rxjs";
import type { MobileDiscoveryError } from "../../types";

type MobileDeviceDiscoverySource = DeviceDiscoverySource<MobileDiscoveryError>;
type MobileDeviceDiscoverySourceEvent = DeviceDiscoverySourceEvent<MobileDiscoveryError>;

export class MockServerDeviceDiscoverySource implements MobileDeviceDiscoverySource {
  readonly transportId = mockserverIdentifier;

  constructor(private readonly dmk: DeviceManagementKit) {}

  listen(): Observable<MobileDeviceDiscoverySourceEvent> {
    return listenToTransportDevices<MobileDiscoveryError>(this.dmk, this.transportId);
  }
}
