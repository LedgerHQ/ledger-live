import { log } from "@ledgerhq/logs";
import React, { useEffect, useState, useMemo } from "react";
import { concat, Observable, of } from "rxjs";
import { catchError, scan, tap } from "rxjs/operators";
import { getMainAccount } from "../../account";
import type {
  ExchangeSwap,
  ExchangeRate,
  InitSwapInput,
  InitSwapResult,
  SwapRequestEvent,
  SwapTransaction,
} from "../../exchange/swap/types";
import type { ConnectAppEvent, Input as ConnectAppInput } from "../connectApp";
import type { AppRequest, AppState } from "./app";
import { createAction as createAppAction } from "./app";
import type { Action, Device } from "./types";
import type { TransactionStatus } from "../../generated/types";

type State = {
  initSwapResult: InitSwapResult | null | undefined;
  initSwapRequested: boolean;
  initSwapError: Error | null | undefined;
  swapId?: string;
  error?: Error;
  isLoading: boolean;
  freezeReduxDevice: boolean;
};

type InitSwapState = AppState & State;

type InitSwapRequest = {
  exchange: ExchangeSwap;
  exchangeRate: ExchangeRate;
  transaction: SwapTransaction;
  requireLatestFirmware?: boolean;
  status?: TransactionStatus;
  device?: React.RefObject<Device | null | undefined>;
};

type Result =
  | {
      initSwapResult: InitSwapResult;
    }
  | {
      initSwapError: Error;
      swapId?: string;
    };

type InitSwapAction = Action<InitSwapRequest, InitSwapState, Result>;

const mapResult = ({
  initSwapResult,
  initSwapError,
  swapId,
}: InitSwapState): Result | null | undefined =>
  initSwapResult
    ? {
        initSwapResult,
      }
    : initSwapError
      ? {
          initSwapError,
          swapId,
        }
      : null;

const initialState: State = {
  initSwapResult: null,
  initSwapError: null,
  swapId: undefined,
  initSwapRequested: false,
  isLoading: true,
  freezeReduxDevice: false,
};

const reducer = (state: State, e: SwapRequestEvent) => {
  switch (e.type) {
    case "init-swap":
      return { ...state, freezeReduxDevice: true };

    case "init-swap-error":
      return {
        ...state,
        initSwapError: e.error,
        swapId: e.swapId,
        isLoading: false,
      };

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
  initSwapExec: (arg0: InitSwapInput) => Observable<SwapRequestEvent>,
): InitSwapAction => {
  const useHook = (
    reduxDevice: Device | null | undefined,
    initSwapRequest: InitSwapRequest,
  ): InitSwapState => {
    const [state, setState] = useState(initialState);
    const reduxDeviceFrozen = useFrozenValue(reduxDevice, state.freezeReduxDevice);

    const { exchange, exchangeRate, transaction, requireLatestFirmware } = initSwapRequest;

    const { fromAccount, fromParentAccount, toAccount, toParentAccount } = exchange;
    const mainFromAccount = getMainAccount(fromAccount, fromParentAccount);
    const maintoAccount = getMainAccount(toAccount, toParentAccount);

    const request: AppRequest = useMemo(() => {
      return {
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
      };
    }, [mainFromAccount, maintoAccount, requireLatestFirmware]);
    const appState = createAppAction(connectAppExec).useHook(reduxDeviceFrozen, request);
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
        }),
      )
        .pipe(
          tap(e => {
            log("actions-initSwap-event", e.type, e);
          }),
          catchError((error: Error) =>
            of(<SwapRequestEvent>{
              type: "init-swap-error",
              error,
            }),
          ),
          scan(reducer, { ...initialState, isLoading: !hasError }),
        )
        .subscribe(setState);
      return () => {
        sub.unsubscribe();
      };
    }, [exchange, exchangeRate, transaction, device, opened, hasError]);

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
