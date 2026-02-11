import { initialState } from "@ledgerhq/live-countervalues/logic";
import { CountervaluesSettings, CounterValuesState } from "@ledgerhq/live-countervalues/types";
import { useSelector } from "~/context/hooks";
import { Action, handleActions, ReducerMap } from "redux-actions";
import {
  CountervaluesActionTypes,
  CountervaluesPayload,
  CountervaluesPollingSetIsPollingPayload,
  CountervaluesPollingSetTriggerLoadPayload,
  CountervaluesStateSetErrorPayload,
  CountervaluesStateSetPayload,
  CountervaluesStateSetPendingPayload,
} from "~/actions/types";
import { State } from "./types";

/// State

export interface CountervaluesState {
  countervalues: {
    state: CounterValuesState;
    pending: boolean;
    error: Error | null;
  };
  polling: {
    isPolling: boolean;
    triggerLoad: boolean;
  };
  userSettings: CountervaluesSettings;
}

export const INITIAL_STATE: CountervaluesState = {
  countervalues: {
    state: initialState,
    pending: false,
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

/// Selectors

export const countervaluesStateSelector = (s: State) => s.countervalues.countervalues.state;
export const countervaluesPendingSelector = (s: State) => s.countervalues.countervalues.pending;
export const countervaluesErrorSelector = (s: State) => s.countervalues.countervalues.error;

export const useCountervaluesStateError = () => useSelector(countervaluesErrorSelector);
export const useCountervaluesStatePending = () => useSelector(countervaluesPendingSelector);
export const useCountervaluesState = () => useSelector(countervaluesStateSelector);

export const useCountervaluesPollingIsPolling = () =>
  useSelector((s: State) => s.countervalues.polling.isPolling);
export const useCountervaluesPollingTriggerLoad = () =>
  useSelector((s: State) => s.countervalues.polling.triggerLoad);

/// Handlers

const handlers: ReducerMap<CountervaluesState, CountervaluesPayload> = {
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
  [CountervaluesActionTypes.COUNTERVALUES_POLLING_SET_IS_POLLING]: (state, action) => ({
    ...state,
    polling: {
      ...state.polling,
      isPolling: (action as Action<CountervaluesPollingSetIsPollingPayload>).payload,
    },
  }),
  [CountervaluesActionTypes.COUNTERVALUES_POLLING_SET_TRIGGER_LOAD]: (state, action) => ({
    ...state,
    polling: {
      ...state.polling,
      triggerLoad: (action as Action<CountervaluesPollingSetTriggerLoadPayload>).payload,
    },
  }),
};

export default handleActions<CountervaluesState, CountervaluesPayload>(handlers, INITIAL_STATE);
