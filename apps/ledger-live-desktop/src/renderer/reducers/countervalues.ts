import { handleActions } from "redux-actions";
import { Handlers } from "./types";
import { shallowEqual, useSelector } from "react-redux";

// State

export type CountervaluesState = {
  marketcap: {
    ids: string[];
    lastUpdated: number;
    isLoading: boolean;
    error: string | null;
  };
};

const INITIAL_STATE: CountervaluesState = {
  marketcap: {
    ids: [],
    lastUpdated: 0,
    isLoading: false,
    error: null,
  },
};

// Selectors

export type RootState = { countervalues: CountervaluesState };

export const countervaluesMarketcapIdsSelector = (s: RootState) => s.countervalues.marketcap.ids;
export const countervaluesMarketcapLastUpdatedSelector = (s: RootState) =>
  s.countervalues.marketcap.lastUpdated;

// Hooks

export const useCountervaluesMarketcapIds = () =>
  useSelector(countervaluesMarketcapIdsSelector, shallowEqual);
export const useCountervaluesMarketcapLastUpdated = () =>
  useSelector(countervaluesMarketcapLastUpdatedSelector);

// Handlers

type HandlersPayloads = {
  SET_COUNTERVALUES_MARKETCAP_IDS: string[];
  SET_COUNTERVALUES_MARKETCAP_LOADING: boolean;
  SET_COUNTERVALUES_MARKETCAP_ERROR: string;
};
type CountervaluesHandlers<PreciseKey = true> = Handlers<
  CountervaluesState,
  HandlersPayloads,
  PreciseKey
>;

const handlers: CountervaluesHandlers = {
  SET_COUNTERVALUES_MARKETCAP_IDS: (
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
  SET_COUNTERVALUES_MARKETCAP_LOADING: (
    state: CountervaluesState,
    { payload }: { payload: boolean },
  ) => ({
    ...state,
    marketcap: {
      ...state.marketcap,
      isLoading: payload,
    },
  }),
  SET_COUNTERVALUES_MARKETCAP_ERROR: (
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
};

export default handleActions<CountervaluesState, HandlersPayloads[keyof HandlersPayloads]>(
  handlers as unknown as CountervaluesHandlers<false>,
  INITIAL_STATE,
);
