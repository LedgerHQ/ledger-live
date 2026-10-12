import { wipeCountervalues } from "@domain/entity-market-countervalues";
import {
  countervaluesSyncInitialState,
  countervaluesSyncSlice,
  setCountervaluesPollingIsPolling,
  setCountervaluesPollingTriggerLoad,
  setCountervaluesStateError,
  setCountervaluesStatePending,
  type CountervaluesSyncState,
} from "./slice";

const { reducer } = countervaluesSyncSlice;

const errored: CountervaluesSyncState = {
  ...countervaluesSyncInitialState,
  error: new Error("network"),
};

describe("countervaluesSyncSlice", () => {
  it("starts from the initial state", () => {
    expect(reducer(undefined, { type: "@@INIT" })).toEqual({
      pending: false,
      error: null,
      isPolling: true,
      triggerLoad: false,
    });
  });

  it("returns the same state for an unrelated action", () => {
    expect(reducer(errored, { type: "UNRELATED" })).toBe(errored);
  });

  it.each([
    [setCountervaluesPollingIsPolling, "COUNTERVALUES_POLLING_SET_IS_POLLING"],
    [setCountervaluesPollingTriggerLoad, "COUNTERVALUES_POLLING_SET_TRIGGER_LOAD"],
    [setCountervaluesStateError, "COUNTERVALUES_STATE_SET_ERROR"],
    [setCountervaluesStatePending, "COUNTERVALUES_STATE_SET_PENDING"],
  ])("keeps the action type string %#: %s", (creator, type) => {
    expect(creator.type).toBe(type);
  });

  it("sets polling flags", () => {
    let state = reducer(countervaluesSyncInitialState, setCountervaluesPollingIsPolling(false));
    state = reducer(state, setCountervaluesPollingTriggerLoad(true));

    expect(state).toEqual({ pending: false, error: null, isPolling: false, triggerLoad: true });
  });

  it("stores the very error given and stops pending", () => {
    const pending = reducer(countervaluesSyncInitialState, setCountervaluesStatePending(true));
    const error = new Error("network");
    const state = reducer(pending, setCountervaluesStateError(error));

    expect(state.error).toBe(error);
    expect(state.pending).toBe(false);
  });

  it("clears the error when a load starts", () => {
    const state = reducer(errored, setCountervaluesStatePending(true));

    expect(state.pending).toBe(true);
    expect(state.error).toBeNull();
  });

  it("keeps the error when pending ends", () => {
    const state = reducer(errored, setCountervaluesStatePending(false));

    expect(state.error).toBe(errored.error);
  });

  // Each app computes its settings and hands them to the middleware; the store never holds them.
  it("holds no user settings and ignores the former settings action", () => {
    expect(reducer(errored, { type: "COUNTERVALUES_USER_SETTINGS_SET", payload: {} })).toBe(
      errored,
    );
    expect(Object.keys(countervaluesSyncInitialState)).toEqual([
      "pending",
      "error",
      "isPolling",
      "triggerLoad",
    ]);
  });

  it("wipes pending and error but keeps polling", () => {
    const populated: CountervaluesSyncState = {
      pending: true,
      error: new Error("network"),
      isPolling: false,
      triggerLoad: true,
    };

    expect(reducer(populated, wipeCountervalues())).toEqual({
      pending: false,
      error: null,
      isPolling: false,
      triggerLoad: true,
    });
  });
});
