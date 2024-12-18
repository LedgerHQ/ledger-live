import { Observable, of, concat } from "rxjs";
import { scan, tap } from "rxjs/operators";
import { useEffect, useState } from "react";
import type { Action, Device } from "./types";
import type { AppState } from "./app";
import { log } from "@ledgerhq/logs";
import { Transaction } from "../../generated/types";
import {
  CompleteExchangeInputFund,
  CompleteExchangeInputSell,
  CompleteExchangeInputSwap,
  CompleteExchangeRequestEvent,
} from "../../exchange/platform/types";

type State = {
  completeExchangeResult: Transaction | null | undefined;
  completeExchangeError: Error | null | undefined;
  freezeReduxDevice: boolean;
  completeExchangeRequested: boolean;
  isLoading: boolean;
  estimatedFees: string | undefined;
};

type CompleteExchangeState = AppState & State;
type CompleteExchangeRequest =
  | CompleteExchangeInputSwap
  | CompleteExchangeInputSell
  | CompleteExchangeInputFund;
type Result =
  | {
      completeExchangeResult: Transaction;
    }
  | {
      completeExchangeError: Error;
    };

type CompleteExchangeAction = Action<CompleteExchangeRequest, CompleteExchangeState, Result>;
export type ExchangeRequestEvent = CompleteExchangeRequestEvent;

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
  estimatedFees: undefined,
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
        estimatedFees: e.estimatedFees,
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
  completeExchangeExec: (arg0: CompleteExchangeRequest) => Observable<ExchangeRequestEvent>,
): CompleteExchangeAction => {
  const useHook = (
    reduxDevice: Device | null | undefined,
    completeExchangeRequest: CompleteExchangeRequest,
  ): CompleteExchangeState => {
    const [state, setState] = useState(initialState);
    const reduxDeviceFrozen = useFrozenValue(reduxDevice, state?.freezeReduxDevice);

    useEffect(() => {
      const sub = concat(
        of(<ExchangeRequestEvent>{
          type: "complete-exchange",
        }),
        completeExchangeExec({
          ...completeExchangeRequest,
          deviceId: reduxDeviceFrozen?.deviceId,
        }),
      )
        .pipe(
          tap(e => {
            log("actions-completeExchange-event", JSON.stringify(e));
          }),
          scan(reducer, initialState),
        )
        .subscribe(setState);
      return () => {
        sub.unsubscribe();
      };
    }, [completeExchangeRequest, reduxDeviceFrozen]);

    return { ...state, device: reduxDeviceFrozen } as CompleteExchangeState;
  };

  return {
    useHook,
    mapResult,
  };
};
