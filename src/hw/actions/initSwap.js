// @flow
import { Observable, of, concat } from "rxjs";
import { scan, tap, catchError } from "rxjs/operators";
import { useEffect, useState } from "react";
import type { ConnectAppEvent, Input as ConnectAppInput } from "../connectApp";
import type { InitSwapInput } from "../../exchange/swap/types";
import type { Action, Device } from "./types";
import type { Transaction } from "../../types";
import type { AppState } from "./app";
import { log } from "@ledgerhq/logs";
import { createAction as createAppAction } from "./app";

import type {
  Exchange,
  ExchangeRate,
  InitSwapResult,
  SwapRequestEvent,
} from "../../exchange/swap/types";

type State = {|
  initSwapResult: ?InitSwapResult,
  initSwapRequested: boolean,
  initSwapError: ?Error,
  isLoading: boolean,
  freezeReduxDevice: boolean,
|};

type InitSwapState = {|
  ...AppState,
  ...State,
|};

type InitSwapRequest = {
  exchange: Exchange,
  exchangeRate: ExchangeRate,
  transaction: Transaction,
};

type Result =
  | {
      initSwapResult: InitSwapResult,
    }
  | {
      initSwapError: Error,
    };

type InitSwapAction = Action<InitSwapRequest, InitSwapState, Result>;

const mapResult = ({ initSwapResult, initSwapError }: InitSwapState): ?Result =>
  initSwapResult
    ? { initSwapResult }
    : initSwapError
    ? { initSwapError }
    : null;

const initialState: State = {
  initSwapResult: null,
  initSwapError: null,
  initSwapRequested: false,
  isLoading: true,
  freezeReduxDevice: false,
};

const reducer = (state: any, e: SwapRequestEvent | { type: "init-swap" }) => {
  switch (e.type) {
    case "init-swap":
      return { ...state, freezeReduxDevice: true };
    case "init-swap-error":
      return {
        ...state,
        initSwapError: e.error,
        isLoading: false,
      };
    case "init-swap-requested":
      return { ...state, initSwapRequested: true, isLoading: false };
    case "init-swap-result":
      return {
        ...state,
        initSwapResult: e.initSwapResult,
        isLoading: false,
      };
  }
  return state;
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
  connectAppExec: (ConnectAppInput) => Observable<ConnectAppEvent>,
  initSwapExec: (InitSwapInput) => Observable<SwapRequestEvent>
): InitSwapAction => {
  const useHook = (
    reduxDevice: ?Device,
    initSwapRequest: InitSwapRequest
  ): InitSwapState => {
    const [state, setState] = useState(initialState);

    const reduxDeviceFrozen = useFrozenValue(
      reduxDevice,
      state.freezeReduxDevice
    );

    const appState = createAppAction(connectAppExec).useHook(
      reduxDeviceFrozen,
      {
        appName: "Exchange",
      }
    );

    const { device, opened } = appState;
    const { exchange, exchangeRate, transaction } = initSwapRequest;

    useEffect(() => {
      if (!opened || !device) {
        setState(initialState);
        return;
      }

      const sub = concat(
        of({ type: "init-swap" }),
        initSwapExec({
          exchange,
          exchangeRate,
          transaction,
          deviceId: device.deviceId,
        })
      )
        .pipe(
          tap((e) => {
            log("actions-initSwap-event", e.type, e);
          }),
          catchError((error) =>
            of({
              type: "init-swap-error",
              error,
            })
          ),
          scan(reducer, initialState)
        )
        .subscribe(setState);

      return () => {
        sub.unsubscribe();
      };
    }, [exchange, exchangeRate, transaction, device, opened]);

    return {
      ...appState,
      ...state,
    };
  };

  return {
    useHook,
    mapResult,
  };
};
