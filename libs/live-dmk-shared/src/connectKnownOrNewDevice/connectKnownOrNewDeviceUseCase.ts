import { log } from "@ledgerhq/logs";
import { Observable, of } from "rxjs";
import { catchError } from "rxjs/operators";

import { DefaultConnectKnownOrNewDeviceStateMachine } from "./ConnectKnownOrNewDeviceStateMachine";
import {
  ConnectKnownOrNewDeviceUIStateTypes,
  type ConnectKnownOrNewDeviceStateMachineInput,
  type ConnectKnownOrNewDeviceUIState,
} from "./types";
import {
  type BaseConnectionError,
  type BaseDiscoveryError,
  type UnknownDiscoveryError,
} from "../deviceConnectivity/types";

const LOG_TYPE = "connectKnownOrNewDeviceUseCase";

export type ConnectKnownOrNewDeviceUseCaseInput<
  TDiscoveryError extends BaseDiscoveryError = BaseDiscoveryError,
  TConnectionError extends BaseConnectionError = BaseConnectionError,
> = Omit<
  ConnectKnownOrNewDeviceStateMachineInput<
    TDiscoveryError | UnknownDiscoveryError,
    TConnectionError
  >,
  "observer"
>;

export type ConnectKnownOrNewDeviceUseCaseOutput<
  TDiscoveryError extends BaseDiscoveryError = BaseDiscoveryError,
  TConnectionError extends BaseConnectionError = BaseConnectionError,
> = {
  /** Each subscription starts a new state machine. The unsubscription stops it. */
  uiStates: Observable<
    ConnectKnownOrNewDeviceUIState<TDiscoveryError | UnknownDiscoveryError, TConnectionError>
  >;
  /** Stops discovery until `resume`. */
  pause: () => void;
  resume: () => void;
};

export function connectKnownOrNewDeviceUseCase<
  TDiscoveryError extends BaseDiscoveryError = BaseDiscoveryError,
  TConnectionError extends BaseConnectionError = BaseConnectionError,
>(
  input: ConnectKnownOrNewDeviceUseCaseInput<TDiscoveryError, TConnectionError>,
): ConnectKnownOrNewDeviceUseCaseOutput<TDiscoveryError, TConnectionError> {
  type UIState = ConnectKnownOrNewDeviceUIState<
    TDiscoveryError | UnknownDiscoveryError,
    TConnectionError
  >;

  let isPaused = input.isPaused ?? false;
  let runningStateMachine: DefaultConnectKnownOrNewDeviceStateMachine<
    TDiscoveryError,
    TConnectionError
  > | null = null;

  const uiStates = new Observable<UIState>(observer => {
    const stateMachine = new DefaultConnectKnownOrNewDeviceStateMachine<
      TDiscoveryError,
      TConnectionError
    >({ ...input, isPaused, observer });
    runningStateMachine = stateMachine;

    stateMachine.start();

    return () => {
      stateMachine.stop();
      if (runningStateMachine === stateMachine) {
        runningStateMachine = null;
      }
    };
  }).pipe(
    catchError(error => {
      log(LOG_TYPE, "unexpected error escaped the connect known or new device state machine", {
        error,
      });
      return of<UIState>({ type: ConnectKnownOrNewDeviceUIStateTypes.UnknownError, error });
    }),
  );

  return {
    uiStates,
    pause: () => {
      isPaused = true;
      runningStateMachine?.pause();
    },
    resume: () => {
      isPaused = false;
      runningStateMachine?.resume();
    },
  };
}
