import { Observable, of, concat } from "rxjs";
import { scan, tap, catchError } from "rxjs/operators";
import { useEffect, useState } from "react";
import type { ConnectAppEvent, Input as ConnectAppInput } from "../connectApp";
import type { Action, Device } from "./types";
import type { Transaction, TransactionStatus } from "../../generated/types";
import type { AppState } from "./app";
import { log } from "@ledgerhq/logs";
import { createAction as createAppAction } from "./app";
import type {
  InitSellResult,
  SellRequestEvent,
} from "../../exchange/sell/types";
import type { Account, AccountLike } from "@ledgerhq/types-live";

type State = {
  initSellResult: InitSellResult | null | undefined;
  initSellRequested: boolean;
  initSellError: Error | null | undefined;
  isLoading: boolean;
  freezeReduxDevice: boolean;
};

type InitSellState = AppState & State;

type InitSellRequest = {
  account: AccountLike;
  parentAccount: Account | null | undefined;
};

type Result =
  | {
      initSellResult: InitSellResult;
    }
  | {
      initSellError: Error;
    };

type InitSellAction = Action<InitSellRequest, InitSellState, Result>;

const mapResult = ({
  initSellResult,
  initSellError,
}: InitSellState): Result | null | undefined =>
  initSellResult
    ? {
        initSellResult,
      }
    : initSellError
    ? {
        initSellError,
      }
    : null;

const initialState: State = {
  initSellResult: null,
  initSellError: null,
  initSellRequested: false,
  isLoading: true,
  freezeReduxDevice: false,
};

const reducer = (state: State, e: SellRequestEvent) => {
  switch (e.type) {
    case "init-sell":
      return { ...state, freezeReduxDevice: true };

    case "init-sell-error":
      return { ...state, initSellError: e.error, isLoading: false };

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
  connectAppExec: (arg0: ConnectAppInput) => Observable<ConnectAppEvent>,
  getTransactionId: (arg0: {
    deviceId: string;
  }) => Observable<SellRequestEvent>,
  checkSignatureAndPrepare: (arg0: {
    deviceId: string;
    binaryPayload: string;
    payloadSignature: string;
    account: AccountLike;
    parentAccount: Account | null | undefined;
    transaction: Transaction;
    status: TransactionStatus;
  }) => Observable<SellRequestEvent>,
  onTransactionId: (arg0: string) => Promise<any> // FIXME define the type for the context?
): InitSellAction => {
  const useHook = (
    reduxDevice: Device | null | undefined,
    initSellRequest: InitSellRequest
  ): InitSellState => {
    const [state, setState] = useState<State>(initialState);
    const [coinifyContext, setCoinifyContext] = useState<{
      binaryPayload: string;
      payloadSignature: string;
      transaction: Transaction;
      status: TransactionStatus;
    } | null>(null);
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
        of(<SellRequestEvent>{
          type: "init-sell",
        }),
        getTransactionId({
          deviceId: device.deviceId,
        })
      )
        .pipe(
          tap((e: SellRequestEvent) => {
            if (e && e.type === "init-sell-get-transaction-id") {
              onTransactionId(e.value).then(setCoinifyContext);
            }

            log("actions-initSell-event", e.type, e);
          }),
          catchError((error: Error) =>
            of(<SellRequestEvent>{
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
    }, [device, opened, account, parentAccount]);
    useEffect(() => {
      if (!coinifyContext || !device) return;
      const { binaryPayload, payloadSignature, transaction, status } =
        coinifyContext;
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
            of(<SellRequestEvent>{
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
    return { ...appState, ...state };
  };

  return {
    useHook,
    mapResult,
  };
};
