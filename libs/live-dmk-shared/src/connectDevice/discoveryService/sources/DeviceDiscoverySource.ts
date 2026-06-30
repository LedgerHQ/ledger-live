import type { DiscoveredDevice, TransportIdentifier } from "@ledgerhq/device-management-kit";
import type { Observable } from "rxjs";
import type { BaseDiscoveryError } from "../../types";

export type DeviceDiscoverySourceEvent<
  TDiscoveryError extends BaseDiscoveryError = BaseDiscoveryError,
> =
  | {
      type: "devices";
      devices: DiscoveredDevice[];
    }
  | {
      type: "error";
      error: TDiscoveryError;
    };

export interface DeviceDiscoverySource<
  TDiscoveryError extends BaseDiscoveryError = BaseDiscoveryError,
> {
  readonly transportId: TransportIdentifier;
  listen(): Observable<DeviceDiscoverySourceEvent<TDiscoveryError>>;
}
