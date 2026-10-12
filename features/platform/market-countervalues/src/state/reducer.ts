import { combineReducers } from "@reduxjs/toolkit";
import {
  countervaluesRatesSlice,
  initialState,
  type CounterValuesState,
} from "@domain/entity-market-countervalues";
import {
  countervaluesSyncInitialState,
  countervaluesSyncSlice,
  type CountervaluesSyncState,
} from "./slice";

/**
 * What both apps mount at the `countervalues` store key: the rates from the entity, and the loop's
 * own state next to them.
 */
export const countervaluesReducer = combineReducers({
  rates: countervaluesRatesSlice.reducer,
  sync: countervaluesSyncSlice.reducer,
});

export type CountervaluesStoreState = {
  rates: CounterValuesState;
  sync: CountervaluesSyncState;
};

export const countervaluesInitialState: CountervaluesStoreState = {
  rates: initialState,
  sync: countervaluesSyncInitialState,
};

type RootState = { countervalues: CountervaluesStoreState };

export function countervaluesStateSelector(s: RootState): CounterValuesState {
  return s.countervalues.rates;
}
export function countervaluesSyncIsPollingSelector(s: RootState): boolean {
  return s.countervalues.sync.isPolling;
}
/**
 * Whether a load is in flight, as a boolean so that a request made meanwhile re-renders nothing.
 *
 * @param s
 * The root state.
 */
export function countervaluesSyncPendingSelector(s: RootState): boolean {
  const { load } = s.countervalues.sync;
  return load === "loading" || load === "loadingThenRequested";
}
export function countervaluesSyncErrorSelector(s: RootState): Error | null {
  return s.countervalues.sync.error;
}
