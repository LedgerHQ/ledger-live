import type { DeviceManagementKit, TransportIdentifier } from "@ledgerhq/device-management-kit";
import {
  listenToTransportDevices,
  type DeviceDiscoverySource,
  type DeviceDiscoverySourceEvent,
} from "@ledgerhq/live-dmk-shared";
import type { Observable } from "rxjs";

import type { DesktopDiscoveryError } from "../../types";

type DesktopDeviceDiscoverySource = DeviceDiscoverySource<DesktopDiscoveryError>;
type DesktopDeviceDiscoverySourceEvent = DeviceDiscoverySourceEvent<DesktopDiscoveryError>;

export class TransportDeviceDiscoverySource implements DesktopDeviceDiscoverySource {
  constructor(
    private readonly dmk: DeviceManagementKit,
    readonly transportId: TransportIdentifier,
  ) {}

  listen(): Observable<DesktopDeviceDiscoverySourceEvent> {
    return listenToTransportDevices<DesktopDiscoveryError>(this.dmk, this.transportId);
  }
}
