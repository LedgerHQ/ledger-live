import { exportCountervalues, initialState } from "@ledgerhq/live-countervalues/logic";
import type { CountervaluesSettings, CounterValuesState } from "@ledgerhq/live-countervalues/types";
import { useSelector } from "LLD/hooks/redux";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

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

// Slice

const countervaluesSlice = createSlice({
  name: "countervalues",
  initialState: INITIAL_STATE,
  reducers: {
    marketcapSetIds: (state, action: PayloadAction<string[]>) => {
      state.marketcap.ids = action.payload;
      state.marketcap.lastUpdated = Date.now();
      state.marketcap.isLoading = false;
      state.marketcap.error = null;
    },
    marketcapSetLoading: (state, action: PayloadAction<boolean>) => {
      state.marketcap.isLoading = action.payload;
    },
    marketcapSetError: (state, action: PayloadAction<string>) => {
      state.marketcap.error = action.payload;
      state.marketcap.isLoading = false;
    },
    pollingSetIsPolling: (state, action: PayloadAction<boolean>) => {
      state.polling.isPolling = action.payload;
    },
    pollingSetTriggerLoad: (state, action: PayloadAction<boolean>) => {
      state.polling.triggerLoad = action.payload;
    },
    stateSet: (state, action: PayloadAction<CounterValuesState>) => {
      state.countervalues.state = action.payload;
    },
    stateSetError: (state, action: PayloadAction<Error>) => {
      state.countervalues.error = action.payload;
      state.countervalues.pending = false;
    },
    stateSetPending: (state, action: PayloadAction<boolean>) => {
      state.countervalues.pending = action.payload;
      state.countervalues.error = action.payload ? null : state.countervalues.error;
    },
    userSettingsSet: (state, action: PayloadAction<CountervaluesSettings>) => {
      state.userSettings = action.payload;
    },
    wipe: state => {
      state.countervalues.state = initialState;
      state.countervalues.pending = false;
      state.countervalues.error = null;
    },
  },
});

export const countervaluesActions = {
  COUNTERVALUES_MARKETCAP_SET_ERROR: countervaluesSlice.actions.marketcapSetError,
  COUNTERVALUES_MARKETCAP_SET_IDS: countervaluesSlice.actions.marketcapSetIds,
  COUNTERVALUES_MARKETCAP_SET_LOADING: countervaluesSlice.actions.marketcapSetLoading,
  COUNTERVALUES_POLLING_SET_IS_POLLING: countervaluesSlice.actions.pollingSetIsPolling,
  COUNTERVALUES_POLLING_SET_TRIGGER_LOAD: countervaluesSlice.actions.pollingSetTriggerLoad,
  COUNTERVALUES_STATE_SET_ERROR: countervaluesSlice.actions.stateSetError,
  COUNTERVALUES_STATE_SET_PENDING: countervaluesSlice.actions.stateSetPending,
  COUNTERVALUES_STATE_SET: countervaluesSlice.actions.stateSet,
  COUNTERVALUES_USER_SETTINGS_SET: countervaluesSlice.actions.userSettingsSet,
  COUNTERVALUES_WIPE: countervaluesSlice.actions.wipe,
};

export default countervaluesSlice.reducer;
