import { log } from "@ledgerhq/logs";
import { Observable, of } from "rxjs";
import { catchError } from "rxjs/operators";

import { DefaultConnectNewDeviceStateMachine } from "./ConnectNewDeviceStateMachine";
import {
  ConnectNewDeviceUIStateTypes,
  type ConnectNewDeviceStateMachineInput,
  type ConnectNewDeviceUIState,
} from "./types";
import {
  type BaseConnectionError,
  type BaseDiscoveryError,
  type UnknownDiscoveryError,
} from "../deviceConnectivity/types";

const LOG_TYPE = "connectNewDeviceUseCase";

export type ConnectNewDeviceUseCaseInput<
  TDiscoveryError extends BaseDiscoveryError = BaseDiscoveryError,
  TConnectionError extends BaseConnectionError = BaseConnectionError,
> = Omit<ConnectNewDeviceStateMachineInput<TDiscoveryError, TConnectionError>, "observer">;

export function connectNewDeviceUseCase<
  TDiscoveryError extends BaseDiscoveryError = BaseDiscoveryError,
  TConnectionError extends BaseConnectionError = BaseConnectionError,
>(
  input: ConnectNewDeviceUseCaseInput<TDiscoveryError, TConnectionError>,
): Observable<ConnectNewDeviceUIState<TDiscoveryError | UnknownDiscoveryError, TConnectionError>> {
  return new Observable<
    ConnectNewDeviceUIState<TDiscoveryError | UnknownDiscoveryError, TConnectionError>
  >(observer => {
    const stateMachine = new DefaultConnectNewDeviceStateMachine<TDiscoveryError, TConnectionError>(
      {
        ...input,
        observer,
      },
    );

    stateMachine.start();

    return () => {
      stateMachine.stop();
    };
  }).pipe(
    /**
     * These errors are not expected to happen in practice: handled discovery and connection failures
     * are emitted as error UI states by the inner SM.
     * This is purely defensive programming: we don't want the outer observable to error.
     */
    catchError(error => {
      log(LOG_TYPE, "unexpected error escaped the connect new device state machine", { error });
      return of<ConnectNewDeviceUIState<TDiscoveryError | UnknownDiscoveryError, TConnectionError>>(
        {
          type: ConnectNewDeviceUIStateTypes.UnknownError,
          error,
        },
      );
    }),
  );
}
