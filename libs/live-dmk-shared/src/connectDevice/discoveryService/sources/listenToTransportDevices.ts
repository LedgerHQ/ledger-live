import type { DeviceManagementKit, TransportIdentifier } from "@ledgerhq/device-management-kit";
import { catchError, map, of, type Observable } from "rxjs";

import { BaseDiscoveryErrorTypes, type BaseDiscoveryError } from "../../types";
import type { DeviceDiscoverySourceEvent } from "./DeviceDiscoverySource";

export function listenToTransportDevices<TDiscoveryError extends BaseDiscoveryError>(
  dmk: DeviceManagementKit,
  transportId: TransportIdentifier,
): Observable<DeviceDiscoverySourceEvent<TDiscoveryError>> {
  return dmk.listenToAvailableDevices({ transport: transportId }).pipe(
    map(devices => ({ type: "devices" as const, devices })),
    catchError(error =>
      of<DeviceDiscoverySourceEvent<TDiscoveryError>>({
        type: "error",
        error: {
          type: BaseDiscoveryErrorTypes.Unknown,
          transportId,
          error,
        } as TDiscoveryError,
      }),
    ),
  );
}
