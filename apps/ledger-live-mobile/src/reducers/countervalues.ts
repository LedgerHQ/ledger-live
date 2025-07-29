import { exportCountervalues, initialState } from "@ledgerhq/live-countervalues/logic";
import { CounterValuesState } from "@ledgerhq/live-countervalues/types";
import { shallowEqual, useSelector } from "react-redux";
import { Action, handleActions, ReducerMap } from "redux-actions";
import {
  CountervaluesActionTypes,
  CountervaluesMarketcapSetErrorPayload,
  CountervaluesMarketcapSetIdsPayload,
  CountervaluesMarketcapSetLoadingPayload,
  CountervaluesPayload,
  CountervaluesStateSetErrorPayload,
  CountervaluesStateSetPayload,
  CountervaluesStateSetPendingPayload,
} from "~/actions/types";
import { State } from "./types";

/// State

export interface CountervaluesState {
  marketcap: {
    ids: string[];
    lastUpdated: number;
    isLoading: boolean;
    error: string | null;
  };
  countervalues: {
    state: CounterValuesState;
    pending: boolean;
    error: Error | null;
  };
}

export const INITIAL_STATE: CountervaluesState = {
  marketcap: {
    ids: [],
    lastUpdated: 0,
    isLoading: false,
    error: null,
  },
  countervalues: {
    state: initialState,
    pending: false,
    error: null,
  },
};

/// Selectors

export const countervaluesMarketcapIdsSelector = (s: State) => s.countervalues.marketcap.ids;
export const countervaluesMarketcapLastUpdatedSelector = (s: State) =>
  s.countervalues.marketcap.lastUpdated;

export const countervaluesStateSelector = (s: State) => s.countervalues.countervalues.state;
export const countervaluesPendingSelector = (s: State) => s.countervalues.countervalues.pending;
export const countervaluesErrorSelector = (s: State) => s.countervalues.countervalues.error;

// Hooks

export const useCountervaluesMarketcapIds = () =>
  useSelector(countervaluesMarketcapIdsSelector, shallowEqual);
export const useCountervaluesMarketcapLastUpdated = () =>
  useSelector(countervaluesMarketcapLastUpdatedSelector);

export const useCountervaluesError = () => useSelector(countervaluesErrorSelector);
export const useCountervaluesExport = () =>
  useSelector((s: State) => exportCountervalues(s.countervalues.countervalues.state), shallowEqual);
export const useCountervaluesPending = () => useSelector(countervaluesPendingSelector);
export const useCountervaluesState = () => useSelector(countervaluesStateSelector, shallowEqual);

/// Handlers

const handlers: ReducerMap<CountervaluesState, CountervaluesPayload> = {
  [CountervaluesActionTypes.COUNTERVALUES_MARKETCAP_SET_IDS]: (state, action) => ({
    ...state,
    marketcap: {
      ...state.marketcap,
      error: null,
      ids: (action as Action<CountervaluesMarketcapSetIdsPayload>).payload,
      isLoading: false,
      lastUpdated: Date.now(),
    },
  }),
  [CountervaluesActionTypes.COUNTERVALUES_MARKETCAP_SET_LOADING]: (state, action) => ({
    ...state,
    marketcap: {
      ...state.marketcap,
      error: null,
      isLoading: (action as Action<CountervaluesMarketcapSetLoadingPayload>).payload,
    },
  }),
  [CountervaluesActionTypes.COUNTERVALUES_MARKETCAP_SET_ERROR]: (state, action) => ({
    ...state,
    marketcap: {
      ...state.marketcap,
      error: (action as Action<CountervaluesMarketcapSetErrorPayload>).payload,
      isLoading: false,
    },
  }),
  [CountervaluesActionTypes.COUNTERVALUES_STATE_SET]: (state, action) => ({
    ...state,
    countervalues: {
      ...state.countervalues,
      state: (action as Action<CountervaluesStateSetPayload>).payload,
    },
  }),
  [CountervaluesActionTypes.COUNTERVALUES_STATE_SET_PENDING]: (state, action) => ({
    ...state,
    countervalues: {
      ...state.countervalues,
      pending: (action as Action<CountervaluesStateSetPendingPayload>).payload,
      error: (action as Action<CountervaluesStateSetPendingPayload>).payload
        ? null
        : state.countervalues.error,
    },
  }),
  [CountervaluesActionTypes.COUNTERVALUES_STATE_SET_ERROR]: (state, action) => ({
    ...state,
    countervalues: {
      ...state.countervalues,
      error: (action as Action<CountervaluesStateSetErrorPayload>).payload,
      pending: false,
    },
  }),
  [CountervaluesActionTypes.COUNTERVALUES_WIPE]: (state, _) => ({
    ...state,
    countervalues: {
      ...state.countervalues,
      state: initialState,
      pending: false,
      error: null,
    },
  }),
};

export default handleActions<CountervaluesState, CountervaluesPayload>(handlers, INITIAL_STATE);
