import type { UnknownAction } from "@reduxjs/toolkit";
import { setCountervaluesState, wipeCountervalues } from "@domain/entity-market-countervalues";
import {
  countervaluesLoadFailed,
  countervaluesLoadRequested,
  countervaluesLoadStarted,
  countervaluesLoadSucceeded,
  countervaluesPollingSet,
  countervaluesSyncInitialState,
  countervaluesSyncSlice,
  type CountervaluesLoad,
  type CountervaluesSyncState,
} from "./slice";

const { reducer } = countervaluesSyncSlice;

const errored: CountervaluesSyncState = {
  ...countervaluesSyncInitialState,
  error: new Error("network"),
};

const loads: CountervaluesLoad[] = ["idle", "requested", "loading", "loadingThenRequested"];

// Each row: an action, then the next `load` from idle, requested, loading, loadingThenRequested.
const transitions: [string, () => UnknownAction, CountervaluesLoad[]][] = [
  [
    "a request",
    () => countervaluesLoadRequested(),
    ["requested", "requested", "loadingThenRequested", "loadingThenRequested"],
  ],
  ["a load start", () => countervaluesLoadStarted(), ["loading", "loading", "loading", "loading"]],
  [
    "a load success",
    () => countervaluesLoadSucceeded(),
    ["idle", "requested", "idle", "requested"],
  ],
  [
    "a load failure",
    () => countervaluesLoadFailed(new Error("network")),
    ["idle", "requested", "idle", "requested"],
  ],
  ["a wipe", () => wipeCountervalues(), ["idle", "requested", "idle", "requested"]],
  ["a polling flag", () => countervaluesPollingSet(true), loads],
  ["new rates", () => setCountervaluesState({ data: {}, status: {}, cache: {} }), loads],
];

const cells = transitions.flatMap(([name, action, next]) =>
  loads.map((load, i) => ({ name, action, load, next: next[i] })),
);

describe("countervaluesSyncSlice", () => {
  it("starts from the initial state", () => {
    expect(reducer(undefined, { type: "@@INIT" })).toEqual({
      load: "idle",
      error: null,
      isPolling: true,
    });
  });

  it("returns the same state for an unrelated action", () => {
    expect(reducer(errored, { type: "UNRELATED" })).toBe(errored);
  });

  it.each([
    [countervaluesLoadRequested, "countervaluesSync/loadRequested"],
    [countervaluesLoadStarted, "countervaluesSync/loadStarted"],
    [countervaluesLoadSucceeded, "countervaluesSync/loadSucceeded"],
    [countervaluesLoadFailed, "countervaluesSync/loadFailed"],
    [countervaluesPollingSet, "countervaluesSync/pollingSet"],
  ])("names action %# %s", (creator, type) => {
    expect(creator.type).toBe(type);
  });

  it.each(cells)("moves $load to $next on $name", ({ action, load, next }) => {
    const state: CountervaluesSyncState = { ...countervaluesSyncInitialState, load };
    const dispatched = action();

    const result = reducer(state, dispatched);

    expect(result.load).toBe(next);
    // Nothing else changes, so an unchanged load is the very same object.
    if (next === load && !countervaluesLoadFailed.match(dispatched)) {
      expect(result).toBe(state);
    }
  });

  it("sets the polling flag and leaves the load", () => {
    const state = reducer(countervaluesSyncInitialState, countervaluesPollingSet(false));

    expect(state).toEqual({ load: "idle", error: null, isPolling: false });
  });

  it("stores the very error given and ends the load", () => {
    const loading = reducer(countervaluesSyncInitialState, countervaluesLoadStarted());
    const error = new Error("network");
    const state = reducer(loading, countervaluesLoadFailed(error));

    expect(state.error).toBe(error);
    expect(state.load).toBe("idle");
  });

  it("clears the error when a load starts", () => {
    const state = reducer(errored, countervaluesLoadStarted());

    expect(state.load).toBe("loading");
    expect(state.error).toBeNull();
  });

  it("keeps the error when a load succeeds", () => {
    const state = reducer(errored, countervaluesLoadSucceeded());

    expect(state).toBe(errored);
  });

  // Each app computes its settings and hands them to the middleware; the store never holds them.
  it("holds no user settings and ignores the former settings action", () => {
    expect(reducer(errored, { type: "COUNTERVALUES_USER_SETTINGS_SET", payload: {} })).toBe(
      errored,
    );
    expect(Object.keys(countervaluesSyncInitialState)).toEqual(["load", "error", "isPolling"]);
  });

  it("wipes the error, ends the load and keeps a request and the polling flag", () => {
    const populated: CountervaluesSyncState = {
      load: "loadingThenRequested",
      error: new Error("network"),
      isPolling: false,
    };

    expect(reducer(populated, wipeCountervalues())).toEqual({
      load: "requested",
      error: null,
      isPolling: false,
    });
  });
});
