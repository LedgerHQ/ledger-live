import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
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

/**
 * The loop's slice. Each load event moves `load` along one of the transition tables below; a wipe
 * ends the load like `countervaluesLoadSucceeded`.
 *
 * `countervaluesReducer` mounts it at `countervalues.sync`, not at its name, so its `selectors`
 * are read through the root selectors `reducer.ts` binds.
 */
export const countervaluesSyncSlice = createSlice({
  name: "countervaluesSync",
  initialState: countervaluesSyncInitialState,
  reducers: {
    /** A poll, a reconnect or a settings change asks for a load. */
    loadRequested(state) {
      state.load = onRequest[state.load];
    },
    /** The middleware takes the request and starts the load. */
    loadStarted(state) {
      state.load = onLoadStart[state.load];
      state.error = null;
    },
    /** The load landed, right after its rates. */
    loadSucceeded(state) {
      state.load = onLoadEnd[state.load];
    },
    /** The load failed with this error. */
    loadFailed(state, { payload }: PayloadAction<Error>) {
      state.error = payload;
      state.load = onLoadEnd[state.load];
    },
    /** The polling timer starts (`true`) or stops (`false`). */
    pollingSet(state, { payload }: PayloadAction<boolean>) {
      state.isPolling = payload;
    },
  },
  extraReducers: builder => {
    builder.addCase(wipeCountervalues, state => {
      state.load = onLoadEnd[state.load];
      state.error = null;
    });
  },
  selectors: {
    /** Whether a load is in flight, as a boolean so that a request made meanwhile re-renders nothing. */
    selectPending: state => state.load === "loading" || state.load === "loadingThenRequested",
    /** The last load's error. */
    selectError: state => state.error,
    /** Whether the polling timer runs. */
    selectIsPolling: state => state.isPolling,
  },
});

export const {
  loadRequested: countervaluesLoadRequested,
  loadStarted: countervaluesLoadStarted,
  loadSucceeded: countervaluesLoadSucceeded,
  loadFailed: countervaluesLoadFailed,
  pollingSet: countervaluesPollingSet,
} = countervaluesSyncSlice.actions;

/** A load is asked for. */
const onRequest: LoadTransition = {
  idle: "requested",
  requested: "requested",
  loading: "loadingThenRequested",
  loadingThenRequested: "loadingThenRequested",
};

/** The request is taken and the load starts, in one step. */
const onLoadStart: LoadTransition = {
  idle: "loading",
  requested: "loading",
  loading: "loading",
  loadingThenRequested: "loading",
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
