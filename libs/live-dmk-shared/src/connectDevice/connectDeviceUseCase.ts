import type { DeviceManagementKit } from "@ledgerhq/device-management-kit";
import { log } from "@ledgerhq/logs";
import type { DeviceModelId } from "@ledgerhq/types-devices";
import { Observable, of } from "rxjs";
import { catchError } from "rxjs/operators";

import { DefaultConnectDeviceStateMachine } from "./ConnectDeviceStateMachine";
import {
  ConnectDeviceUIStateTypes,
  type BaseConnectionError,
  type BaseDiscoveryError,
  type ConnectDeviceUIState,
  type ConnectDeviceMapConnectionError,
  type ConnectDeviceMatchDiscoveredDevices,
  type DeviceDiscoveryService,
  type DeviceConnectionResult,
  type KnownDevice,
  type UnknownDiscoveryError,
} from "./types";
import { filterKnownDevicesByAcceptedModels } from "./utils";

const LOG_TYPE = "connectDeviceUseCase";

export type ConnectDeviceUseCaseInput<
  TDiscoveryError extends BaseDiscoveryError = BaseDiscoveryError,
  TConnectionError extends BaseConnectionError = BaseConnectionError,
> = {
  knownDevices: Array<KnownDevice>;
  acceptedDeviceModelIds?: Array<DeviceModelId>;
  dmk: DeviceManagementKit;
  deviceDiscoveryService: DeviceDiscoveryService<TDiscoveryError>;
  matchDiscoveredDevices: ConnectDeviceMatchDiscoveredDevices;
  mapConnectionError: ConnectDeviceMapConnectionError<TConnectionError>;
  onConnected: (result: DeviceConnectionResult) => void;
};

export function connectDeviceUseCase<
  TDiscoveryError extends BaseDiscoveryError = BaseDiscoveryError,
  TConnectionError extends BaseConnectionError = BaseConnectionError,
>(
  input: ConnectDeviceUseCaseInput<TDiscoveryError, TConnectionError>,
): Observable<ConnectDeviceUIState<TDiscoveryError | UnknownDiscoveryError, TConnectionError>> {
  return new Observable<
    ConnectDeviceUIState<TDiscoveryError | UnknownDiscoveryError, TConnectionError>
  >(observer => {
    const connectedDevices = input.dmk.listConnectedDevices();
    const sessionId = connectedDevices.length === 1 ? connectedDevices[0].sessionId : null;
    const knownDevices = filterKnownDevicesByAcceptedModels(
      input.knownDevices,
      input.acceptedDeviceModelIds,
    );

    const stateMachine = new DefaultConnectDeviceStateMachine<TDiscoveryError, TConnectionError>({
      ...input,
      knownDevices,
      sessionId,
      observer,
    });

    stateMachine.start();

    return () => {
      stateMachine.stop();
    };
  }).pipe(
    /**
     * These errors are not expected to happen in practice: handled connection failures are emitted as
     * ConnectionError UI states by the inner SM, and listConnectedDevices should never throw.
     * This is purely defensive programming: we don't want the outer observable to error.
     */
    catchError(error => {
      log(LOG_TYPE, "unexpected error escaped the connect device state machine", { error });
      return of<ConnectDeviceUIState<TDiscoveryError | UnknownDiscoveryError, TConnectionError>>({
        type: ConnectDeviceUIStateTypes.UnknownError,
        error,
      });
    }),
  );
}
