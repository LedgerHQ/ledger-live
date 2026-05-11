import type { DiscoveredDevice, TransportIdentifier } from "@ledgerhq/device-management-kit";
import type { Observable } from "rxjs";
import type { DiscoveryError } from "../../types";

export type DeviceDiscoverySourceEvent =
  | {
      type: "devices";
      devices: DiscoveredDevice[];
    }
  | {
      type: "error";
      error: DiscoveryError;
    };

export interface DeviceDiscoverySource {
  readonly transportId: TransportIdentifier;
  listen(): Observable<DeviceDiscoverySourceEvent>;
}
