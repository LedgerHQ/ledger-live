import { createAction, type UnknownAction } from "@reduxjs/toolkit";
import {
  initialState,
  type CountervaluesSettings,
  type CounterValuesState,
} from "@domain/entity-market-countervalues";

// The Redux slice both apps mount at the `countervalues` store key. Its action types are plain
// strings because listeners outside the slice match them by value.

export type CountervaluesState = {
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
};

export const countervaluesInitialState: CountervaluesState = {
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

export const setCountervaluesPollingIsPolling = createAction<boolean>(
  "COUNTERVALUES_POLLING_SET_IS_POLLING",
);
export const setCountervaluesPollingTriggerLoad = createAction<boolean>(
  "COUNTERVALUES_POLLING_SET_TRIGGER_LOAD",
);
export const setCountervaluesState = createAction<CounterValuesState>("COUNTERVALUES_STATE_SET");
export const setCountervaluesStateError = createAction<Error>("COUNTERVALUES_STATE_SET_ERROR");
export const setCountervaluesStatePending = createAction<boolean>(
  "COUNTERVALUES_STATE_SET_PENDING",
);
export const setCountervaluesUserSettings = createAction<CountervaluesSettings>(
  "COUNTERVALUES_USER_SETTINGS_SET",
);
export const wipeCountervalues = createAction("COUNTERVALUES_WIPE");

/**
 * Not `createSlice` nor `createReducer`: immer would deep-freeze the stored rate `Map`s, which
 * `loadCountervalues` mutates in place on the next poll.
 */
export function countervaluesReducer(
  state: CountervaluesState = countervaluesInitialState,
  action: UnknownAction,
): CountervaluesState {
  if (setCountervaluesPollingIsPolling.match(action)) {
    return { ...state, polling: { ...state.polling, isPolling: action.payload } };
  }
  if (setCountervaluesPollingTriggerLoad.match(action)) {
    return { ...state, polling: { ...state.polling, triggerLoad: action.payload } };
  }
  if (setCountervaluesState.match(action)) {
    return { ...state, countervalues: { ...state.countervalues, state: action.payload } };
  }
  if (setCountervaluesStateError.match(action)) {
    return {
      ...state,
      countervalues: { ...state.countervalues, error: action.payload, pending: false },
    };
  }
  if (setCountervaluesStatePending.match(action)) {
    return {
      ...state,
      countervalues: {
        ...state.countervalues,
        pending: action.payload,
        // a new load clears the previous error
        error: action.payload ? null : state.countervalues.error,
      },
    };
  }
  if (setCountervaluesUserSettings.match(action)) {
    return { ...state, userSettings: action.payload };
  }
  if (wipeCountervalues.match(action)) {
    return {
      ...state,
      countervalues: { ...state.countervalues, state: initialState, pending: false, error: null },
    };
  }
  return state;
}

type RootState = { countervalues: CountervaluesState };

export function countervaluesPollingIsPollingSelector(s: RootState): boolean {
  return s.countervalues.polling.isPolling;
}
export function countervaluesPollingTriggerLoadSelector(s: RootState): boolean {
  return s.countervalues.polling.triggerLoad;
}
export function countervaluesStateSelector(s: RootState): CounterValuesState {
  return s.countervalues.countervalues.state;
}
export function countervaluesStatePendingSelector(s: RootState): boolean {
  return s.countervalues.countervalues.pending;
}
export function countervaluesStateErrorSelector(s: RootState): Error | null {
  return s.countervalues.countervalues.error;
}
export function countervaluesUserSettingsSelector(s: RootState): CountervaluesSettings {
  return s.countervalues.userSettings;
}
