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

/** The rates' cache alone: what conversions read. */
export function countervaluesCacheSelector(s: RootState): CounterValuesState["cache"] {
  return s.countervalues.rates.cache;
}

/** The sync selectors, read from the root state. */
export const {
  selectPending: countervaluesSyncPendingSelector,
  selectError: countervaluesSyncErrorSelector,
  selectIsPolling: countervaluesSyncIsPollingSelector,
} = countervaluesSyncSlice.getSelectors((s: RootState) => s.countervalues.sync);
