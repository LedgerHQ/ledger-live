import { handleActions } from "redux-actions";
import { Handlers } from "./types";

export type CountervaluesState = {
  marketcap: {
    ids: string[];
    lastUpdated: number;
    isLoading: boolean;
    error: string | null;
  };
};

const state: CountervaluesState = {
  marketcap: {
    ids: [],
    lastUpdated: 0,
    isLoading: false,
    error: null,
  },
};

type HandlersPayloads = {
  FETCH_COUNTERVALUES_MARKETCAP_IDS: undefined;
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
  FETCH_COUNTERVALUES_MARKETCAP_IDS: (state: CountervaluesState) => ({
    ...state,
    marketcap: {
      ...state.marketcap,
      isLoading: true,
      error: null,
    },
  }),
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

// Selectors
export const marketcapIdsSelector = (s: { countervalues: CountervaluesState }) =>
  s.countervalues.marketcap.ids;

export const marketcapLastUpdatedSelector = (s: { countervalues: CountervaluesState }) =>
  s.countervalues.marketcap.lastUpdated;

// Reducer export
export default handleActions<CountervaluesState, HandlersPayloads[keyof HandlersPayloads]>(
  handlers as unknown as CountervaluesHandlers<false>,
  state,
);
