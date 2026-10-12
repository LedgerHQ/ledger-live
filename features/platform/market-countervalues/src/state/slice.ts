import { createAction, createSlice } from "@reduxjs/toolkit";
import { wipeCountervalues } from "@domain/entity-market-countervalues";

// The countervalues loop's own state, mounted next to the rates by `countervaluesReducer`. The action
// types are plain strings because listeners outside the slice match them by value.

export type CountervaluesSyncState = {
  /** A load is in flight. */
  pending: boolean;
  /** The last load's error, cleared when the next load starts. */
  error: Error | null;
  isPolling: boolean;
  /** A load is asked for; the middleware runs it once no load is pending. */
  triggerLoad: boolean;
};

export const countervaluesSyncInitialState: CountervaluesSyncState = {
  pending: false,
  error: null,
  isPolling: true,
  triggerLoad: false,
};

export const setCountervaluesPollingIsPolling = createAction<boolean>(
  "COUNTERVALUES_POLLING_SET_IS_POLLING",
);
export const setCountervaluesPollingTriggerLoad = createAction<boolean>(
  "COUNTERVALUES_POLLING_SET_TRIGGER_LOAD",
);
export const setCountervaluesStateError = createAction<Error>("COUNTERVALUES_STATE_SET_ERROR");
export const setCountervaluesStatePending = createAction<boolean>(
  "COUNTERVALUES_STATE_SET_PENDING",
);

export const countervaluesSyncSlice = createSlice({
  name: "countervaluesSync",
  initialState: countervaluesSyncInitialState,
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(setCountervaluesPollingIsPolling, (state, { payload }) => {
        state.isPolling = payload;
      })
      .addCase(setCountervaluesPollingTriggerLoad, (state, { payload }) => {
        state.triggerLoad = payload;
      })
      .addCase(setCountervaluesStatePending, (state, { payload }) => {
        state.pending = payload;
        // a new load clears the previous error
        if (payload) state.error = null;
      })
      .addCase(setCountervaluesStateError, (state, { payload }) => {
        state.error = payload;
        state.pending = false;
      })
      .addCase(wipeCountervalues, state => {
        state.pending = false;
        state.error = null;
      });
  },
});
