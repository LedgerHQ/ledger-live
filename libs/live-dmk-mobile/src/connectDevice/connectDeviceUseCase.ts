import type { DeviceManagementKit } from "@ledgerhq/device-management-kit";
import { log } from "@ledgerhq/logs";
import { Observable, of } from "rxjs";
import { catchError } from "rxjs/operators";

import { DefaultConnectDeviceStateMachine } from "./ConnectDeviceStateMachine";
import {
  ConnectDeviceUIStateTypes,
  type ConnectDeviceUIState,
  type DeviceConnectionResult,
} from "./types";
import { DefaultDeviceDiscoveryService } from "./discoveryService/DefaultDeviceDiscoveryService";
import { KnownDevice } from "@ledgerhq/live-dmk-shared";

const LOG_TYPE = "connectDeviceUseCase";

export type ConnectDeviceUseCaseInput = {
  knownDevices: Array<KnownDevice>;
  dmk: DeviceManagementKit;
  onConnected: (result: DeviceConnectionResult) => void;
};

export function connectDeviceUseCase(
  input: ConnectDeviceUseCaseInput,
): Observable<ConnectDeviceUIState> {
  return new Observable<ConnectDeviceUIState>(observer => {
    const connectedDevices = input.dmk.listConnectedDevices();
    const sessionId = connectedDevices.length === 1 ? connectedDevices[0].sessionId : null;

    const stateMachine = new DefaultConnectDeviceStateMachine({
      ...input,
      sessionId,
      deviceDiscoveryService: new DefaultDeviceDiscoveryService(input.dmk),
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
      return of<ConnectDeviceUIState>({
        type: ConnectDeviceUIStateTypes.UnknownError,
        error,
      });
    }),
  );
}
