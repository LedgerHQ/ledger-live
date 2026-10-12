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

// What both apps mount at the `countervalues` store key: the rates from the entity, and the loop's
// own state next to them.

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
export function countervaluesSyncTriggerLoadSelector(s: RootState): boolean {
  return s.countervalues.sync.triggerLoad;
}
export function countervaluesSyncPendingSelector(s: RootState): boolean {
  return s.countervalues.sync.pending;
}
export function countervaluesSyncErrorSelector(s: RootState): Error | null {
  return s.countervalues.sync.error;
}
