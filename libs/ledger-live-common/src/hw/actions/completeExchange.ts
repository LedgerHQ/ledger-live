import { Observable, of, concat } from "rxjs";
import { scan, tap } from "rxjs/operators";
import { useEffect, useState } from "react";
import type { Action, Device } from "./types";
import type { AppState } from "./app";
import { log } from "@ledgerhq/logs";
import { Exchange } from "../../exchange/swap/types";
import { Transaction } from "../../generated/types";

type State = {
  completeExchangeResult: Transaction | null | undefined;
  completeExchangeError: Error | null | undefined;
  freezeReduxDevice: boolean;
  completeExchangeRequested: boolean;
  isLoading: boolean;
};

type CompleteExchangeState = AppState & State;
type CompleteExchangeRequest = {
  deviceId?: string;
  provider: string;
  transaction: Transaction;
  binaryPayload: string;
  signature: string;
  exchange: Exchange;
  exchangeType: number;
  rateType: number;
};
type Result =
  | {
      completeExchangeResult: Transaction;
    }
  | {
      completeExchangeError: Error;
    };

type CompleteExchangeAction = Action<
  CompleteExchangeRequest,
  CompleteExchangeState,
  Result
>;
export type ExchangeRequestEvent =
  | { type: "complete-exchange" }
  | { type: "complete-exchange-requested" }
  | { type: "complete-exchange-error"; error: Error }
  | { type: "complete-exchange-result"; completeExchangeResult: Transaction };

const mapResult = ({
  completeExchangeResult,
  completeExchangeError,
}: CompleteExchangeState): Result | null | undefined =>
  completeExchangeResult
    ? {
        completeExchangeResult,
      }
    : completeExchangeError
    ? {
        completeExchangeError,
      }
    : null;

const initialState: State = {
  completeExchangeResult: null,
  completeExchangeError: null,
  completeExchangeRequested: false,
  freezeReduxDevice: false,
  isLoading: true,
};

const reducer = (state: State, e: ExchangeRequestEvent) => {
  switch (e.type) {
    case "complete-exchange":
      return {
        ...state,
        completeExchangeStarted: true,
        freezeReduxDevice: true,
      };

    case "complete-exchange-error":
      return {
        ...state,
        completeExchangeError: e.error,
        isLoading: false,
      };

    case "complete-exchange-requested":
      return {
        ...state,
        completeExchangeRequested: true,
        isLoading: false,
      };
    case "complete-exchange-result":
      return {
        ...state,
        completeExchangeResult: e.completeExchangeResult,
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
  completeExchangeExec: (
    arg0: CompleteExchangeRequest
  ) => Observable<ExchangeRequestEvent>
): CompleteExchangeAction => {
  const useHook = (
    reduxDevice: Device | null | undefined,
    completeExchangeRequest: CompleteExchangeRequest
  ): CompleteExchangeState => {
    const [state, setState] = useState(initialState);
    const reduxDeviceFrozen = useFrozenValue(
      reduxDevice,
      state?.freezeReduxDevice
    );

    const {
      provider,
      transaction,
      binaryPayload,
      signature,
      exchange,
      exchangeType,
      rateType,
    } = completeExchangeRequest;

    useEffect(() => {
      const sub = concat(
        of(<ExchangeRequestEvent>{
          type: "complete-exchange",
        }),
        completeExchangeExec({
          deviceId: reduxDeviceFrozen?.deviceId,
          provider,
          transaction,
          binaryPayload,
          signature,
          exchange,
          exchangeType,
          rateType,
        })
      )
        .pipe(
          tap((e) => {
            log("actions-completeExchange-event", JSON.stringify(e));
          }),
          scan(reducer, initialState)
        )
        .subscribe(setState);
      return () => {
        sub.unsubscribe();
      };
    }, [
      provider,
      transaction,
      binaryPayload,
      signature,
      exchange,
      exchangeType,
      rateType,
      reduxDeviceFrozen,
    ]);

    return { ...state, device: reduxDeviceFrozen } as CompleteExchangeState;
  };

  return {
    useHook,
    mapResult,
  };
};
