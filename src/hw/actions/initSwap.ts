import { Observable, of, concat } from "rxjs";
import { scan, tap, catchError } from "rxjs/operators";
import { useEffect, useState } from "react";
import { getMainAccount } from "../../account";
import type { ConnectAppEvent, Input as ConnectAppInput } from "../connectApp";
import type { InitSwapInput, SwapTransaction } from "../../exchange/swap/types";
import type { Action, Device } from "./types";
import type { AppState } from "./app";
import { log } from "@ledgerhq/logs";
import { createAction as createAppAction } from "./app";
import type {
  Exchange,
  ExchangeRate,
  InitSwapResult,
  SwapRequestEvent,
} from "../../exchange/swap/types";

type State = {
  initSwapResult: InitSwapResult | null | undefined;
  initSwapRequested: boolean;
  initSwapError: Error | null | undefined;
  error?: Error;
  isLoading: boolean;
  freezeReduxDevice: boolean;
};

type InitSwapState = AppState & State;

type InitSwapRequest = {
  exchange: Exchange;
  exchangeRate: ExchangeRate;
  transaction: SwapTransaction;
  userId?: string;
  requireLatestFirmware?: boolean;
};

type Result =
  | {
      initSwapResult: InitSwapResult;
    }
  | {
      initSwapError: Error;
    };

type InitSwapAction = Action<InitSwapRequest, InitSwapState, Result>;

const mapResult = ({
  initSwapResult,
  initSwapError,
}: InitSwapState): Result | null | undefined =>
  initSwapResult
    ? {
        initSwapResult,
      }
    : initSwapError
    ? {
        initSwapError,
      }
    : null;

const initialState: State = {
  initSwapResult: null,
  initSwapError: null,
  initSwapRequested: false,
  isLoading: true,
  freezeReduxDevice: false,
};

const reducer = (state: State, e: SwapRequestEvent) => {
  switch (e.type) {
    case "init-swap":
      return { ...state, freezeReduxDevice: true };

    case "init-swap-error":
      return { ...state, initSwapError: e.error, isLoading: false };

    case "init-swap-requested":
      return {
        ...state,
        initSwapRequested: true,
        isLoading: false,
        amountExpectedTo: e.amountExpectedTo,
        estimatedFees: e.estimatedFees,
      };

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
  connectAppExec: (arg0: ConnectAppInput) => Observable<ConnectAppEvent>,
  initSwapExec: (arg0: InitSwapInput) => Observable<SwapRequestEvent>
): InitSwapAction => {
  const useHook = (
    reduxDevice: Device | null | undefined,
    initSwapRequest: InitSwapRequest
  ): InitSwapState => {
    const [state, setState] = useState(initialState);
    const reduxDeviceFrozen = useFrozenValue(
      reduxDevice,
      state.freezeReduxDevice
    );

    const {
      exchange,
      exchangeRate,
      transaction,
      userId,
      requireLatestFirmware,
    } = initSwapRequest;

    const { fromAccount, fromParentAccount, toAccount, toParentAccount } =
      exchange;
    const mainFromAccount = getMainAccount(fromAccount, fromParentAccount);
    const maintoAccount = getMainAccount(toAccount, toParentAccount);
    const appState = createAppAction(connectAppExec).useHook(
      reduxDeviceFrozen,
      {
        appName: "Exchange",
        dependencies: [
          {
            account: mainFromAccount,
          },
          {
            account: maintoAccount,
          },
        ],
        requireLatestFirmware,
      }
    );
    const { device, opened, error } = appState;
    const hasError = error || state.error;
    useEffect(() => {
      if (!opened || !device) {
        setState({ ...initialState, isLoading: !!device });
        return;
      }

      const sub = concat(
        of(<SwapRequestEvent>{
          type: "init-swap",
        }),
        initSwapExec({
          exchange,
          exchangeRate,
          transaction,
          deviceId: device.deviceId,
          userId,
        })
      )
        .pipe(
          tap((e) => {
            log("actions-initSwap-event", e.type, e);
          }),
          catchError((error: Error) =>
            of(<SwapRequestEvent>{
              type: "init-swap-error",
              error,
            })
          ),
          scan(reducer, { ...initialState, isLoading: !hasError })
        )
        .subscribe(setState);
      return () => {
        sub.unsubscribe();
      };
    }, [exchange, exchangeRate, transaction, device, opened, hasError, userId]);

    return {
      ...appState,
      ...state,
    } as InitSwapState;
  };

  return {
    useHook,
    mapResult,
  };
};
