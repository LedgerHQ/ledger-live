import type { DeviceManagementKit } from "@ledgerhq/device-management-kit";
import {
  BlePoweredOff,
  rnBleTransportIdentifier,
} from "@ledgerhq/device-transport-kit-react-native-ble";
import { BleError, BleErrorCode } from "react-native-ble-plx";
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
          catchError((error: unknown) => {
            // BLE was turned off mid-scan: re-run the preflight pipeline so the
            // consumer receives the proper platform-specific BluetoothDisabled*
            // error (with the right resolution + retry) instead of a generic
            // Unknown error. Works for both Android and iOS.
            if (isBluetoothPoweredOffError(error)) {
              return this.listen();
            }

            return of(this.mapUnknownErrorToDiscoveryEvent(error));
          }),
        );
      }),
      catchError(error => of(this.mapUnknownErrorToDiscoveryEvent(error))),
    );
  }

  private mapUnknownErrorToDiscoveryEvent(error: unknown): DeviceDiscoverySourceEvent {
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

const isBluetoothPoweredOffError = (error: unknown): boolean => {
  if (error instanceof BlePoweredOff) {
    return true;
  }

  if (error instanceof BleError && error.errorCode === BleErrorCode.BluetoothPoweredOff) {
    return true;
  }

  return false;
};
