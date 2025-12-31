import { exportCountervalues, initialState } from "@ledgerhq/live-countervalues/logic";
import type { CountervaluesSettings, CounterValuesState } from "@ledgerhq/live-countervalues/types";
import { useSelector } from "LLD/hooks/redux";
import { handleActions } from "redux-actions";
import type { CountervaluesHandlersPayloads, Handlers } from "./types";

// State

export type CountervaluesState = {
  countervalues: {
    state: CounterValuesState;
    pending: boolean;
    error: Error | null;
  };
  marketcap: {
    ids: string[];
    lastUpdated: number;
    isLoading: boolean;
    error: string | null;
  };
  polling: {
    isPolling: boolean;
    triggerLoad: boolean;
  };
  userSettings: CountervaluesSettings;
};

const INITIAL_STATE: CountervaluesState = {
  countervalues: {
    state: initialState,
    pending: false,
    error: null,
  },
  marketcap: {
    ids: [],
    lastUpdated: 0,
    isLoading: false,
    error: null,
  },
  polling: {
    isPolling: true,
    triggerLoad: false,
  },
  // dummy values that should be overriden by the context provider
  userSettings: {
    trackingPairs: [],
    autofillGaps: true,
    refreshRate: 0,
    marketCapBatchingAfterRank: 0,
  },
};

// Selectors

export type RootState = { countervalues: CountervaluesState };

export const countervaluesMarketcapIdsSelector = (s: RootState) => s.countervalues.marketcap.ids;
export const countervaluesMarketcapLastUpdatedSelector = (s: RootState) =>
  s.countervalues.marketcap.lastUpdated;
export const countervaluesPollingIsPollingSelector = (s: RootState) =>
  s.countervalues.polling.isPolling;
export const countervaluesPollingTriggerLoadSelector = (s: RootState) =>
  s.countervalues.polling.triggerLoad;
export const countervaluesStateSelector = (s: RootState) => s.countervalues.countervalues.state;
export const countervaluesStatePendingSelector = (s: RootState) =>
  s.countervalues.countervalues.pending;
export const countervaluesStateErrorSelector = (s: RootState) =>
  s.countervalues.countervalues.error;
export const countervaluesUserSettingsSelector = (s: RootState) => s.countervalues.userSettings;
export const countervaluesStateExportSelector = (s: RootState) =>
  exportCountervalues(s.countervalues.countervalues.state);

// Hooks

export const useCountervaluesMarketcapIds = () => useSelector(countervaluesMarketcapIdsSelector);
export const useCountervaluesMarketcapLastUpdated = () =>
  useSelector(countervaluesMarketcapLastUpdatedSelector);
export const useCountervaluesPollingIsPolling = () =>
  useSelector(countervaluesPollingIsPollingSelector);
export const useCountervaluesPollingTriggerLoad = () =>
  useSelector(countervaluesPollingTriggerLoadSelector);
export const useCountervaluesStateError = () => useSelector(countervaluesStateErrorSelector);
export const useCountervaluesStateExport = () => useSelector(countervaluesStateExportSelector);
export const useCountervaluesStatePending = () => useSelector(countervaluesStatePendingSelector);
export const useCountervaluesState = () => useSelector(countervaluesStateSelector);
export const useCountervaluesUserSettings = () => useSelector(countervaluesUserSettingsSelector);

// Handlers

type CountervaluesHandlers<PreciseKey = true> = Handlers<
  CountervaluesState,
  CountervaluesHandlersPayloads,
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
  COUNTERVALUES_POLLING_SET_IS_POLLING: (
    state: CountervaluesState,
    { payload }: { payload: boolean },
  ) => ({
    ...state,
    polling: {
      ...state.polling,
      isPolling: payload,
    },
  }),
  COUNTERVALUES_POLLING_SET_TRIGGER_LOAD: (
    state: CountervaluesState,
    { payload }: { payload: boolean },
  ) => ({
    ...state,
    polling: {
      ...state.polling,
      triggerLoad: payload,
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
  COUNTERVALUES_STATE_SET_ERROR: (state: CountervaluesState, { payload }: { payload: Error }) => ({
    ...state,
    countervalues: {
      ...state.countervalues,
      error: payload,
      pending: false,
    },
  }),
  COUNTERVALUES_STATE_SET_PENDING: (
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
  COUNTERVALUES_USER_SETTINGS_SET: (
    state: CountervaluesState,
    { payload }: { payload: CountervaluesSettings },
  ) => ({
    ...state,
    userSettings: payload,
  }),
  COUNTERVALUES_WIPE: (state: CountervaluesState) => ({
    ...state,
    countervalues: {
      ...state.countervalues,
      state: initialState,
      pending: false,
      error: null,
    },
  }),
};

export default handleActions<
  CountervaluesState,
  CountervaluesHandlersPayloads[keyof CountervaluesHandlersPayloads]
>(handlers as unknown as CountervaluesHandlers<false>, INITIAL_STATE);
