import { combineReducers } from "@reduxjs/toolkit";
import { probeAction } from "../utils/internals/renderProbe";
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
const combinedCountervaluesReducer = combineReducers({
  rates: countervaluesRatesSlice.reducer,
  sync: countervaluesSyncSlice.reducer,
});

// MEASUREMENT BUILD ONLY, NEVER MERGE.
export const countervaluesReducer: typeof combinedCountervaluesReducer = (state, action) => {
  probeAction(state, action);
  return combinedCountervaluesReducer(state, action);
};

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
/** The sync selectors, read from the root state. */
export const {
  selectPending: countervaluesSyncPendingSelector,
  selectError: countervaluesSyncErrorSelector,
  selectIsPolling: countervaluesSyncIsPollingSelector,
} = countervaluesSyncSlice.getSelectors((s: RootState) => s.countervalues.sync);
