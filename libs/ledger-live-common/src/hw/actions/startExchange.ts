import { Observable, of, concat } from "rxjs";
import { scan, tap } from "rxjs/operators";
import { useEffect, useState } from "react";
import type { ConnectAppEvent, Input as ConnectAppInput } from "../connectApp";
import type { Action, Device } from "./types";
import type { AppState } from "./app";
import { log } from "@ledgerhq/logs";
import { createAction as createAppAction } from "./app";
import { ExchangeType } from "@ledgerhq/live-app-sdk";

type State = {
  startExchangeResult: string | null | undefined;
  startExchangeError: Error | null | undefined;
  freezeReduxDevice: boolean;
  isLoading: boolean;
  error?: Error; //NB connectApp errors
};

type StartExchangeState = AppState & State;
type StartExchangeRequest = { exchangeType: ExchangeType };
export type Result =
  | {
      startExchangeResult: string;
    }
  | {
      startExchangeError: Error;
    };

type StartExchangeAction = Action<any, StartExchangeState, Result>;
export type ExchangeRequestEvent =
  | { type: "start-exchange" }
  | { type: "start-exchange-error"; error: Error }
  | { type: "start-exchange-result"; nonce: string };

const mapResult = ({
  startExchangeResult,
  startExchangeError,
}: StartExchangeState): Result | null | undefined =>
  startExchangeResult
    ? {
        startExchangeResult,
      }
    : startExchangeError
    ? {
        startExchangeError,
      }
    : null;

const initialState: State = {
  startExchangeResult: null,
  startExchangeError: null,
  freezeReduxDevice: false,
  isLoading: false,
};

const reducer = (state: State, e: ExchangeRequestEvent) => {
  switch (e.type) {
    case "start-exchange":
      return { ...state, freezeReduxDevice: true };

    case "start-exchange-error":
      return { ...state, startExchangeError: e.error, isLoading: false };

    case "start-exchange-result":
      return {
        ...state,
        startExchangeResult: e.nonce,
        isLoading: false,
      };
  }
};

function useFrozenValue<T>(value: T, frozen: boolean): T {
  const [state, setState] = useState(value);
  useEffect(() => {
    if (!frozen) {
      setState(value);
    }
  }, [value, frozen]);
  return state;
}

export const createAction = (
  connectAppExec: (arg0: ConnectAppInput) => Observable<ConnectAppEvent>,
  startExchangeExec: (arg0: {
    deviceId: string;
    exchangeType: ExchangeType;
    appVersion?: string;
  }) => Observable<ExchangeRequestEvent>,
): StartExchangeAction => {
  const useHook = (
    reduxDevice: Device | null | undefined,
    startExchangeRequest: StartExchangeRequest,
  ): StartExchangeState => {
    const [state, setState] = useState(initialState);
    const reduxDeviceFrozen = useFrozenValue(reduxDevice, state.freezeReduxDevice);

    const { exchangeType } = startExchangeRequest;

    const appState = createAppAction(connectAppExec).useHook(reduxDeviceFrozen, {
      appName: "Exchange",
    });

    const { device, opened, error, appAndVersion } = appState;

    const hasError = error || state.error;
    useEffect(() => {
      if (!opened || !device) {
        // isLoading should be false until we have a device to show the correct animation
        setState({ ...initialState, isLoading: device ? !hasError : false });
        return;
      }

      const sub = concat(
        of(<ExchangeRequestEvent>{
          type: "start-exchange",
        }),
        startExchangeExec({
          deviceId: device.deviceId,
          exchangeType,
          appVersion: appAndVersion?.version,
        }),
      )
        .pipe(
          tap(e => {
            log("actions-startExchange-event", JSON.stringify(e));
          }),
          scan(reducer, initialState),
        )
        .subscribe(setState);
      return () => {
        sub.unsubscribe();
      };
    }, [device, opened, exchangeType, hasError, appAndVersion]);

    return {
      ...appState,
      ...state,
    } as StartExchangeState;
  };

  return {
    useHook,
    mapResult,
  };
};
