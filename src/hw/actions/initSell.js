// @flow
import { Observable, of, concat } from "rxjs";
import { scan, tap, catchError } from "rxjs/operators";
import { useEffect, useState } from "react";
import type { ConnectAppEvent, Input as ConnectAppInput } from "../connectApp";
import type { Action, Device } from "./types";
import type {
  AccountLike,
  Transaction,
  TransactionStatus,
  Account,
} from "../../types";
import type { AppState } from "./app";
import { log } from "@ledgerhq/logs";
import { createAction as createAppAction } from "./app";
import type {
  InitSellResult,
  SellRequestEvent,
} from "../../exchange/sell/types";

type State = {|
  initSellResult: ?InitSellResult,
  initSellRequested: boolean,
  initSellError: ?Error,
  isLoading: boolean,
  freezeReduxDevice: boolean,
|};

type InitSellState = {|
  ...AppState,
  ...State,
|};

type InitSellRequest = {
  account: AccountLike,
  parentAccount: ?Account,
};

type Result =
  | {
      initSellResult: InitSellResult,
    }
  | {
      initSellError: Error,
    };

type InitSellAction = Action<InitSellRequest, InitSellState, Result>;

const mapResult = ({ initSellResult, initSellError }: InitSellState): ?Result =>
  initSellResult
    ? { initSellResult }
    : initSellError
    ? { initSellError }
    : null;

const initialState: State = {
  initSellResult: null,
  initSellError: null,
  initSellRequested: false,
  isLoading: true,
  freezeReduxDevice: false,
};

const reducer = (state: any, e: SellRequestEvent | { type: "init-sell" }) => {
  switch (e.type) {
    case "init-sell":
      return { ...state, freezeReduxDevice: true };
    case "init-sell-error":
      return {
        ...state,
        initSellError: e.error,
        isLoading: false,
      };
    case "init-sell-get-transaction-id":
      return { ...state, initSellRequested: true, isLoading: false };
    case "init-sell-result":
      return {
        ...state,
        initSellResult: e.initSellResult,
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
  getTransactionId: ({ deviceId: string }) => Observable<SellRequestEvent>,
  checkSignatureAndPrepare: ({
    deviceId: string,
    binaryPayload: string,
    payloadSignature: string,
    account: AccountLike,
    parentAccount: ?Account,
    transaction: Transaction,
    status: TransactionStatus,
  }) => Observable<SellRequestEvent>,
  onTransactionId: (string) => Promise<any> // FIXME define the type for the context?
): InitSellAction => {
  const useHook = (
    reduxDevice: ?Device,
    initSellRequest: InitSellRequest
  ): InitSellState => {
    const [state, setState] = useState(initialState);
    const [coinifyContext, setCoinifyContext] = useState(null);

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
    const { parentAccount, account } = initSellRequest;

    useEffect(() => {
      if (!opened || !device) {
        setState(initialState);
        return;
      }

      const sub = concat(
        of({ type: "init-sell" }),
        getTransactionId({
          deviceId: device.deviceId,
        }).pipe(
          tap((e: SellRequestEvent) => {
            if (e && e.type === "init-sell-get-transaction-id") {
              onTransactionId(e.value).then(setCoinifyContext);
            }
            log("actions-initSell-event", e.type, e);
          }),
          catchError((error) =>
            of({
              type: "init-sell-error",
              error,
            })
          ),
          scan(reducer, initialState)
        )
      ).subscribe(setState);

      return () => {
        sub.unsubscribe();
      };
    }, [device, opened, account, parentAccount]);

    useEffect(() => {
      if (!coinifyContext || !device) return;

      const {
        binaryPayload,
        payloadSignature,
        transaction,
        status,
      } = coinifyContext;

      const sub = checkSignatureAndPrepare({
        deviceId: device.deviceId,
        binaryPayload,
        payloadSignature,
        account,
        parentAccount,
        transaction,
        status,
      })
        .pipe(
          catchError((error) =>
            of({
              type: "init-sell-error",
              error,
            })
          ),
          scan(reducer, initialState)
        )
        .subscribe(setState);

      return () => {
        sub.unsubscribe();
      };
    }, [coinifyContext, device, opened, account, parentAccount]);

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
