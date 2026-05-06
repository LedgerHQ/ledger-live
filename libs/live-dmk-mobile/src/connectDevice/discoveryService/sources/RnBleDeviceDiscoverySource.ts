import type { DeviceManagementKit } from "@ledgerhq/device-management-kit";
import { rnBleTransportIdentifier } from "@ledgerhq/device-transport-kit-react-native-ble";
import { catchError, from, map, mergeMap, of, type Observable } from "rxjs";
import { DiscoveryErrors } from "../../types";
import { DefaultBleDiscoveryPreflightChecks } from "../preflight/DefaultBleDiscoveryPreflightChecks";
import type { DiscoveryPreflightChecks } from "../preflight/preflightResult";
import {
  type DeviceDiscoverySource,
  type DeviceDiscoverySourceEvent,
} from "./DeviceDiscoverySource";

export class RnBleDeviceDiscoverySource implements DeviceDiscoverySource {
  readonly transportId = rnBleTransportIdentifier;

  constructor(
    private readonly dmk: DeviceManagementKit,
    private readonly preflightChecks: DiscoveryPreflightChecks = new DefaultBleDiscoveryPreflightChecks(),
  ) {}

  listen(): Observable<DeviceDiscoverySourceEvent> {
    return from(this.preflightChecks.getPreflight()).pipe(
      mergeMap(preflightResult => {
        if (!preflightResult.success) {
          const event: DeviceDiscoverySourceEvent = {
            type: "error",
            error: preflightResult.discoveryError,
          };

          return of(event);
        }

        return this.dmk.listenToAvailableDevices({ transport: this.transportId }).pipe(
          map(
            devices =>
              ({
                type: "devices",
                devices,
              }) as const,
          ),
        );
      }),
      catchError(error => of(this.getUnknownDiscoveryErrorEvent(error))),
    );
  }

  private getUnknownDiscoveryErrorEvent(error: unknown): DeviceDiscoverySourceEvent {
    return {
      type: "error",
      error: {
        type: DiscoveryErrors.Unknown,
        transportID: this.transportId,
        error,
      },
    };
  }
}
