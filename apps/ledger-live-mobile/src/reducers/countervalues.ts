import { shallowEqual, useSelector } from "react-redux";
import { Action, handleActions, ReducerMap } from "redux-actions";
import {
  CountervaluesActionTypes,
  CountervaluesMarketcapSetErrorPayload,
  CountervaluesMarketcapSetIdsPayload,
  CountervaluesMarketcapSetLoadingPayload,
  CountervaluesPayload,
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
}

export const INITIAL_STATE: CountervaluesState = {
  marketcap: {
    ids: [],
    lastUpdated: 0,
    isLoading: false,
    error: null,
  },
};

/// Selectors

export const countervaluesMarketcapIdsSelector = (s: State) => s.countervalues.marketcap.ids;
export const countervaluesMarketcapLastUpdatedSelector = (s: State) =>
  s.countervalues.marketcap.lastUpdated;

// Hooks

export const useCountervaluesMarketcapIds = () =>
  useSelector(countervaluesMarketcapIdsSelector, shallowEqual);
export const useCountervaluesMarketcapLastUpdated = () =>
  useSelector(countervaluesMarketcapLastUpdatedSelector);

/// Handlers

const handlers: ReducerMap<CountervaluesState, CountervaluesPayload> = {
  [CountervaluesActionTypes.FETCH_COUNTERVALUES_MARKETCAP_IDS]: (state, _) => ({
    ...state,
    marketcap: {
      ...state.marketcap,
      isLoading: true,
      error: null,
    },
  }),
  [CountervaluesActionTypes.SET_COUNTERVALUES_MARKETCAP_IDS]: (state, action) => ({
    ...state,
    marketcap: {
      ...state.marketcap,
      error: null,
      ids: (action as Action<CountervaluesMarketcapSetIdsPayload>).payload,
      isLoading: false,
      lastUpdated: Date.now(),
    },
  }),
  [CountervaluesActionTypes.SET_COUNTERVALUES_MARKETCAP_LOADING]: (state, action) => ({
    ...state,
    marketcap: {
      ...state.marketcap,
      error: null,
      isLoading: (action as Action<CountervaluesMarketcapSetLoadingPayload>).payload,
    },
  }),
  [CountervaluesActionTypes.SET_COUNTERVALUES_MARKETCAP_ERROR]: (state, action) => ({
    ...state,
    marketcap: {
      ...state.marketcap,
      error: (action as Action<CountervaluesMarketcapSetErrorPayload>).payload,
      isLoading: false,
    },
  }),
};

export default handleActions<CountervaluesState, CountervaluesPayload>(handlers, INITIAL_STATE);
