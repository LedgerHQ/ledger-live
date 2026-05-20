import type { DeviceManagementKit } from "@ledgerhq/device-management-kit";
import { rnHidTransportIdentifier } from "@ledgerhq/device-transport-kit-react-native-hid";
import { catchError, map, of, type Observable } from "rxjs";
import { DiscoveryErrorTypes } from "../../types";
import {
  type DeviceDiscoverySource,
  type DeviceDiscoverySourceEvent,
} from "./DeviceDiscoverySource";

export class RnHidDeviceDiscoverySource implements DeviceDiscoverySource {
  readonly transportId = rnHidTransportIdentifier;

  constructor(private readonly dmk: DeviceManagementKit) {}

  listen(): Observable<DeviceDiscoverySourceEvent> {
    return this.dmk.listenToAvailableDevices({ transport: this.transportId }).pipe(
      map(
        devices =>
          ({
            type: "devices",
            devices,
          }) as const,
      ),
      catchError(error => {
        const event: DeviceDiscoverySourceEvent = {
          type: "error" as const,
          error: {
            type: DiscoveryErrorTypes.Unknown,
            transportId: this.transportId,
            error,
          },
        };

        return of(event);
      }),
    );
  }
}
