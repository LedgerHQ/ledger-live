import { initialState } from "./logic";
import { countervaluesRatesSlice, setCountervaluesState, wipeCountervalues } from "./slice";
import type { CounterValuesState } from "./types";

const { reducer } = countervaluesRatesSlice;

function loadedState(): CounterValuesState {
  const map = new Map([["latest", 1]]);
  return {
    data: { "bitcoin USD": map },
    status: { "bitcoin USD": { timestamp: 1 } },
    cache: { "bitcoin USD": { map: new Map(map), stats: {}, fallback: 1 } },
  };
}

describe("countervaluesRatesSlice", () => {
  it("starts from the entity's initial state", () => {
    expect(reducer(undefined, { type: "@@INIT" })).toBe(initialState);
  });

  it.each([
    [setCountervaluesState, "countervaluesRates/set"],
    [wipeCountervalues, "countervaluesRates/wipe"],
  ])("names action %# %s", (creator, type) => {
    expect(creator.type).toBe(type);
  });

  it("returns the same state for an unrelated action", () => {
    const stored = reducer(initialState, setCountervaluesState(loadedState()));

    expect(reducer(stored, { type: "UNRELATED" })).toBe(stored);
  });

  it("stores the given state as is", () => {
    const next = loadedState();

    expect(reducer(initialState, setCountervaluesState(next))).toBe(next);
  });

  // Deep-freezing would walk every rate entry on each load.
  it("freezes a stored state shallowly, leaving its rate maps writable", () => {
    const next = loadedState();
    const stored = reducer(initialState, setCountervaluesState(next));

    expect(Object.isFrozen(stored)).toBe(true);
    expect(Object.isFrozen(stored.data)).toBe(false);
    expect(Object.isFrozen(stored.data["bitcoin USD"])).toBe(false);
    expect(Object.isFrozen(stored.cache["bitcoin USD"].map)).toBe(false);
    expect(() => next.data["bitcoin USD"].set("latest", 2)).not.toThrow();
  });

  it("wipes back to the initial state", () => {
    const stored = reducer(initialState, setCountervaluesState(loadedState()));

    expect(reducer(stored, wipeCountervalues())).toBe(initialState);
  });
});
