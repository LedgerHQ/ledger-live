import type { DeviceManagementKit } from "@ledgerhq/device-management-kit";
import { rnHidTransportIdentifier } from "@ledgerhq/device-transport-kit-react-native-hid";
import type { DeviceDiscoverySource, DeviceDiscoverySourceEvent } from "@ledgerhq/live-dmk-shared";
import { catchError, map, of, type Observable } from "rxjs";
import { BaseDiscoveryErrorTypes, type MobileDiscoveryError } from "../../types";

type MobileDeviceDiscoverySource = DeviceDiscoverySource<MobileDiscoveryError>;
type MobileDeviceDiscoverySourceEvent = DeviceDiscoverySourceEvent<MobileDiscoveryError>;

export class RnHidDeviceDiscoverySource implements MobileDeviceDiscoverySource {
  readonly transportId = rnHidTransportIdentifier;

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
