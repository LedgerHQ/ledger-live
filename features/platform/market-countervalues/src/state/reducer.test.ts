import {
  initialState,
  setCountervaluesState,
  wipeCountervalues,
  type CounterValuesState,
} from "@domain/entity-market-countervalues";
import {
  countervaluesInitialState,
  countervaluesReducer,
  countervaluesCacheSelector,
  countervaluesStateSelector,
  countervaluesSyncErrorSelector,
  countervaluesSyncIsPollingSelector,
  countervaluesSyncPendingSelector,
  type CountervaluesStoreState,
} from "./reducer";
import {
  countervaluesLoadFailed,
  countervaluesLoadStarted,
  countervaluesPollingSet,
  type CountervaluesLoad,
} from "./slice";

function loadedState(): CounterValuesState {
  return { data: { "bitcoin USD": new Map([["latest", 1]]) }, status: {}, cache: {} };
}

describe("countervaluesReducer", () => {
  it("starts with the entity's initial rates and the loop's initial state", () => {
    const state = countervaluesReducer(undefined, { type: "@@INIT" });

    expect(state).toEqual(countervaluesInitialState);
    expect(state.rates).toBe(initialState);
    expect(Object.keys(state)).toEqual(["rates", "sync"]);
  });

  it("returns the same state for an unrelated action", () => {
    const state = countervaluesReducer(countervaluesInitialState, { type: "UNRELATED" });

    expect(state).toBe(countervaluesInitialState);
  });

  it("keeps the loop's state when the rates change", () => {
    const rates = loadedState();
    const state = countervaluesReducer(countervaluesInitialState, setCountervaluesState(rates));

    expect(state.rates).toBe(rates);
    expect(state.sync).toBe(countervaluesInitialState.sync);
  });

  it("keeps the rates when the loop's state changes", () => {
    const loaded = countervaluesReducer(
      countervaluesInitialState,
      setCountervaluesState(loadedState()),
    );
    const state = countervaluesReducer(loaded, countervaluesPollingSet(false));

    expect(state.rates).toBe(loaded.rates);
    expect(state.sync.isPolling).toBe(false);
  });

  it("wipes the rates, pending and error, and keeps the polling flags", () => {
    let state = countervaluesReducer(
      countervaluesInitialState,
      setCountervaluesState(loadedState()),
    );
    state = countervaluesReducer(state, countervaluesPollingSet(false));
    state = countervaluesReducer(state, countervaluesLoadStarted());
    state = countervaluesReducer(state, countervaluesLoadFailed(new Error("network")));
    state = countervaluesReducer(state, countervaluesLoadStarted());

    const wiped = countervaluesReducer(state, wipeCountervalues());

    expect(wiped.rates).toBe(initialState);
    expect(wiped.sync).toEqual({ load: "idle", error: null, isPolling: false });
  });

  it("reads every field through its selector", () => {
    const rates = loadedState();
    const error = new Error("network");
    const countervalues: CountervaluesStoreState = {
      rates,
      sync: { load: "loadingThenRequested", error, isPolling: false },
    };
    const root = { countervalues };

    expect(countervaluesStateSelector(root)).toBe(rates);
    expect(countervaluesCacheSelector(root)).toBe(rates.cache);
    expect(countervaluesSyncPendingSelector(root)).toBe(true);
    expect(countervaluesSyncErrorSelector(root)).toBe(error);
    expect(countervaluesSyncIsPollingSelector(root)).toBe(false);
  });

  it.each<[CountervaluesLoad, boolean]>([
    ["idle", false],
    ["requested", false],
    ["loading", true],
    ["loadingThenRequested", true],
  ])("reads %s as pending: %s", (load, pending) => {
    const root = {
      countervalues: {
        ...countervaluesInitialState,
        sync: { ...countervaluesInitialState.sync, load },
      },
    };

    expect(countervaluesSyncPendingSelector(root)).toBe(pending);
  });
});
