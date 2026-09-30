import type { DeviceManagementKit, TransportIdentifier } from "@ledgerhq/device-management-kit";
import type { DeviceDiscoverySourceEvent } from "@ledgerhq/live-dmk-shared";
import { catchError, map, of, type Observable } from "rxjs";
import { BaseDiscoveryErrorTypes, type MobileDiscoveryError } from "../../types";

type MobileDeviceDiscoverySourceEvent = DeviceDiscoverySourceEvent<MobileDiscoveryError>;

export function listenToTransportDevices(
  dmk: DeviceManagementKit,
  transportId: TransportIdentifier,
): Observable<MobileDeviceDiscoverySourceEvent> {
  return dmk.listenToAvailableDevices({ transport: transportId }).pipe(
    map(
      devices =>
        ({
          type: "devices",
          devices,
        }) as const,
    ),
    catchError(error => {
      const event: MobileDeviceDiscoverySourceEvent = {
        type: "error" as const,
        error: {
          type: BaseDiscoveryErrorTypes.Unknown,
          transportId,
          error,
        },
      };

      return of(event);
    }),
  );
}
