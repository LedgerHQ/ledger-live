import type { DeviceManagementKit } from "@ledgerhq/device-management-kit";
import type { DeviceDiscoverySource, DeviceDiscoverySourceEvent } from "@ledgerhq/live-dmk-shared";
import { catchError, map, of, type Observable } from "rxjs";

import { BaseDiscoveryErrorTypes, type DesktopDiscoveryError } from "../../types";
import { webHidIdentifier as webHidTransportIdentifier } from "@ledgerhq/device-transport-kit-web-hid";

type DesktopDeviceDiscoverySource = DeviceDiscoverySource<DesktopDiscoveryError>;
type DesktopDeviceDiscoverySourceEvent = DeviceDiscoverySourceEvent<DesktopDiscoveryError>;

export class WebHidDeviceDiscoverySource implements DesktopDeviceDiscoverySource {
  readonly transportId = webHidTransportIdentifier;

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
