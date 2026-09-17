import type { DeviceManagementKit } from "@ledgerhq/device-management-kit";
import { speculosIdentifier } from "@ledgerhq/device-transport-kit-speculos";
import type { DeviceDiscoverySource, DeviceDiscoverySourceEvent } from "@ledgerhq/live-dmk-shared";
import { catchError, map, of, type Observable } from "rxjs";
import { BaseDiscoveryErrorTypes, type MobileDiscoveryError } from "../../types";

type MobileDeviceDiscoverySource = DeviceDiscoverySource<MobileDiscoveryError>;
type MobileDeviceDiscoverySourceEvent = DeviceDiscoverySourceEvent<MobileDiscoveryError>;

export class SpeculosDeviceDiscoverySource implements MobileDeviceDiscoverySource {
  readonly transportId = speculosIdentifier;

  constructor(private readonly dmk: DeviceManagementKit) {}

  listen(): Observable<MobileDeviceDiscoverySourceEvent> {
    return this.dmk.listenToAvailableDevices({ transport: this.transportId }).pipe(
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
            transportId: this.transportId,
            error,
          },
        };

        return of(event);
      }),
    );
  }
}
