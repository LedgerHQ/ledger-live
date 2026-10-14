import { combineReducers } from "@reduxjs/toolkit";
import { probeAction, probeSelector, probeStateChange } from "../utils/internals/renderProbe";
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
  const next = combinedCountervaluesReducer(state, action);
  probeStateChange(state, next, action);
  return next;
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

function readRates(s: RootState): CounterValuesState {
  return s.countervalues.rates;
}
const syncSelectors = countervaluesSyncSlice.getSelectors((s: RootState) => s.countervalues.sync);

// MEASUREMENT BUILD ONLY, NEVER MERGE. Timed selectors.
export const countervaluesStateSelector = probeSelector("countervaluesStateSelector", readRates);
/** The sync selectors, read from the root state. */
export const countervaluesSyncPendingSelector = probeSelector(
  "countervaluesSyncPendingSelector",
  syncSelectors.selectPending,
);
export const countervaluesSyncErrorSelector = probeSelector(
  "countervaluesSyncErrorSelector",
  syncSelectors.selectError,
);
export const countervaluesSyncIsPollingSelector = probeSelector(
  "countervaluesSyncIsPollingSelector",
  syncSelectors.selectIsPolling,
);
