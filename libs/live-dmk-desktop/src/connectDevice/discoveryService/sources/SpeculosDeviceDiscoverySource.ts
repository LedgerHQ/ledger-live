import type { DeviceManagementKit } from "@ledgerhq/device-management-kit";
import { speculosIdentifier } from "@ledgerhq/device-transport-kit-speculos";
import type { DeviceDiscoverySource, DeviceDiscoverySourceEvent } from "@ledgerhq/live-dmk-shared";
import { catchError, map, of, type Observable } from "rxjs";

import { BaseDiscoveryErrorTypes, type DesktopDiscoveryError } from "../../types";

type DesktopDeviceDiscoverySource = DeviceDiscoverySource<DesktopDiscoveryError>;
type DesktopDeviceDiscoverySourceEvent = DeviceDiscoverySourceEvent<DesktopDiscoveryError>;

export class SpeculosDeviceDiscoverySource implements DesktopDeviceDiscoverySource {
  readonly transportId = speculosIdentifier;

  constructor(private readonly dmk: DeviceManagementKit) {}

  listen(): Observable<DesktopDeviceDiscoverySourceEvent> {
    return this.dmk
      .listenToAvailableDevices({
        transport: this.transportId,
      })
      .pipe(
        map(
          devices =>
            ({
              type: "devices",
              devices,
            }) as const,
        ),
        catchError(error => {
          const event: DesktopDeviceDiscoverySourceEvent = {
            type: "error",
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
