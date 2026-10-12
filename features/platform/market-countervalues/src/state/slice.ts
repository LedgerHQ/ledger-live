import { createAction, createSlice } from "@reduxjs/toolkit";
import { wipeCountervalues } from "@domain/entity-market-countervalues";

/**
 * Where the loop stands with loads: whether one is asked for, whether one is in flight.
 *
 * - `idle`: no load is asked for, none is in flight.
 * - `requested`: a load is asked for; the middleware starts it on its next tick.
 * - `loading`: a load is in flight, and no other is asked for.
 * - `loadingThenRequested`: a load is in flight, and another is asked for. It starts once the
 *   first one lands, so loads never overlap.
 */
export type CountervaluesLoad = "idle" | "requested" | "loading" | "loadingThenRequested";

/** The countervalues loop's own state, mounted next to the rates by `countervaluesReducer`. */
export type CountervaluesSyncState = {
  /** Where the loop stands with loads. */
  load: CountervaluesLoad;
  /** The last load's error, cleared when the next load starts. */
  error: Error | null;
  /** Whether the polling timer runs. */
  isPolling: boolean;
};

export const countervaluesSyncInitialState: CountervaluesSyncState = {
  load: "idle",
  error: null,
  isPolling: true,
};

// The action types are plain strings because listeners outside the slice match them by value.

export const setCountervaluesPollingIsPolling = createAction<boolean>(
  "COUNTERVALUES_POLLING_SET_IS_POLLING",
);
/** `true` asks for a load; `false` takes the request, as the load starts. */
export const setCountervaluesPollingTriggerLoad = createAction<boolean>(
  "COUNTERVALUES_POLLING_SET_TRIGGER_LOAD",
);
export const setCountervaluesStateError = createAction<Error>("COUNTERVALUES_STATE_SET_ERROR");
/** `true` when a load starts, `false` when it lands. */
export const setCountervaluesStatePending = createAction<boolean>(
  "COUNTERVALUES_STATE_SET_PENDING",
);

/**
 * The loop's slice. Each action moves `load` along one of the transition tables below; a wipe
 * and an error end the load like `setCountervaluesStatePending(false)`.
 */
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
        state.load = (payload ? onRequest : onRequestTaken)[state.load];
      })
      .addCase(setCountervaluesStatePending, (state, { payload }) => {
        state.load = (payload ? onLoadStart : onLoadEnd)[state.load];
        // a new load clears the previous error
        if (payload) state.error = null;
      })
      .addCase(setCountervaluesStateError, (state, { payload }) => {
        state.error = payload;
        state.load = onLoadEnd[state.load];
      })
      .addCase(wipeCountervalues, state => {
        state.load = onLoadEnd[state.load];
        state.error = null;
      });
  },
});

/** A load is asked for. */
const onRequest: LoadTransition = {
  idle: "requested",
  requested: "requested",
  loading: "loadingThenRequested",
  loadingThenRequested: "loadingThenRequested",
};

/** The middleware takes the request, right before it starts the load. */
const onRequestTaken: LoadTransition = {
  idle: "idle",
  requested: "idle",
  loading: "loading",
  loadingThenRequested: "loading",
};

/** A load starts. */
const onLoadStart: LoadTransition = {
  idle: "loading",
  requested: "loadingThenRequested",
  loading: "loading",
  loadingThenRequested: "loadingThenRequested",
};

/** A load lands, with rates or an error, or the rates are wiped. A request made meanwhile stays. */
const onLoadEnd: LoadTransition = {
  idle: "idle",
  requested: "requested",
  loading: "idle",
  loadingThenRequested: "requested",
};

/** The next `load` for each current one. */
type LoadTransition = Record<CountervaluesLoad, CountervaluesLoad>;
