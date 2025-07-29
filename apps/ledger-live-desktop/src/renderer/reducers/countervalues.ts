import { exportCountervalues, initialState } from "@ledgerhq/live-countervalues/logic";
import { CounterValuesState } from "@ledgerhq/live-countervalues/types";
import { shallowEqual, useSelector } from "react-redux";
import { handleActions } from "redux-actions";
import { Handlers } from "./types";

// State

export type CountervaluesState = {
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
};

const INITIAL_STATE: CountervaluesState = {
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

// Selectors

export type RootState = { countervalues: CountervaluesState };

export const countervaluesMarketcapIdsSelector = (s: RootState) => s.countervalues.marketcap.ids;
export const countervaluesMarketcapLastUpdatedSelector = (s: RootState) =>
  s.countervalues.marketcap.lastUpdated;

export const countervaluesStateSelector = (s: RootState) => s.countervalues.countervalues.state;
export const countervaluesPendingSelector = (s: RootState) => s.countervalues.countervalues.pending;
export const countervaluesErrorSelector = (s: RootState) => s.countervalues.countervalues.error;

// Hooks

export const useCountervaluesMarketcapIds = () =>
  useSelector(countervaluesMarketcapIdsSelector, shallowEqual);
export const useCountervaluesMarketcapLastUpdated = () =>
  useSelector(countervaluesMarketcapLastUpdatedSelector);

export const useCountervaluesError = () => useSelector(countervaluesErrorSelector, shallowEqual);
export const useCountervaluesExport = () =>
  useSelector((s: RootState) => exportCountervalues(s.countervalues.countervalues.state));
export const useCountervaluesPending = () => useSelector(countervaluesPendingSelector);
export const useCountervaluesState = () => useSelector(countervaluesStateSelector, shallowEqual);

// Handlers

type HandlersPayloads = {
  COUNTERVALUES_MARKETCAP_SET_ERROR: string;
  COUNTERVALUES_MARKETCAP_SET_IDS: string[];
  COUNTERVALUES_MARKETCAP_SET_LOADING: boolean;
  COUNTERVALUES_STATE_ERROR_SET: Error;
  COUNTERVALUES_STATE_PENDING_SET: boolean;
  COUNTERVALUES_STATE_SET: CounterValuesState;
  COUNTERVALUES_WIPE_STATE: undefined;
};

type CountervaluesHandlers<PreciseKey = true> = Handlers<
  CountervaluesState,
  HandlersPayloads,
  PreciseKey
>;

const handlers: CountervaluesHandlers = {
  COUNTERVALUES_MARKETCAP_SET_IDS: (
    state: CountervaluesState,
    { payload }: { payload: string[] },
  ) => ({
    ...state,
    marketcap: {
      ...state.marketcap,
      ids: payload,
      lastUpdated: Date.now(),
      isLoading: false,
      error: null,
    },
  }),
  COUNTERVALUES_MARKETCAP_SET_LOADING: (
    state: CountervaluesState,
    { payload }: { payload: boolean },
  ) => ({
    ...state,
    marketcap: {
      ...state.marketcap,
      isLoading: payload,
    },
  }),
  COUNTERVALUES_MARKETCAP_SET_ERROR: (
    state: CountervaluesState,
    { payload }: { payload: string },
  ) => ({
    ...state,
    marketcap: {
      ...state.marketcap,
      error: payload,
      isLoading: false,
    },
  }),
  COUNTERVALUES_STATE_SET: (
    state: CountervaluesState,
    { payload }: { payload: CounterValuesState },
  ) => ({
    ...state,
    countervalues: {
      ...state.countervalues,
      state: payload,
    },
  }),
  COUNTERVALUES_STATE_ERROR_SET: (state: CountervaluesState, { payload }: { payload: Error }) => ({
    ...state,
    countervalues: {
      ...state.countervalues,
      error: payload,
      pending: false,
    },
  }),
  COUNTERVALUES_STATE_PENDING_SET: (
    state: CountervaluesState,
    { payload }: { payload: boolean },
  ) => ({
    ...state,
    countervalues: {
      ...state.countervalues,
      pending: payload,
      error: payload ? null : state.countervalues.error, // Clear error when starting new request
    },
  }),
  COUNTERVALUES_WIPE_STATE: (state: CountervaluesState) => ({
    ...state,
    countervalues: {
      ...state.countervalues,
      state: initialState,
      pending: false,
      error: null,
    },
  }),
};

export default handleActions<CountervaluesState, HandlersPayloads[keyof HandlersPayloads]>(
  handlers as unknown as CountervaluesHandlers<false>,
  INITIAL_STATE,
);
