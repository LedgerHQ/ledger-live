import { configureStore } from "@reduxjs/toolkit";
import {
  countervaluesLoadFailed,
  countervaluesLoadRequested,
  countervaluesLoadStarted,
  countervaluesLoadSucceeded,
  countervaluesReducer,
} from "@features/platform-market-countervalues";
import { logFirstCountervaluesLoad } from "../logFirstCountervaluesLoad";
import { startupEvents } from "../logStartupTime";

function createStore() {
  return configureStore({ reducer: { countervalues: countervaluesReducer } });
}

const loggedEvents = () => startupEvents.map(e => e.event);

describe("logFirstCountervaluesLoad", () => {
  beforeEach(() => {
    startupEvents.splice(0);
  });

  it("logs when the first load ends", () => {
    const store = createStore();
    logFirstCountervaluesLoad(store);

    store.dispatch(countervaluesLoadRequested());
    store.dispatch(countervaluesLoadStarted());
    expect(loggedEvents()).toEqual([]);

    store.dispatch(countervaluesLoadSucceeded());
    expect(loggedEvents()).toEqual(["Countervalues first load done"]);
  });

  it("logs a failed first load as failed", () => {
    const store = createStore();
    logFirstCountervaluesLoad(store);

    store.dispatch(countervaluesLoadStarted());
    store.dispatch(countervaluesLoadFailed(new Error("offline")));

    expect(loggedEvents()).toEqual(["Countervalues first load failed"]);
  });

  it("does not log the later loads", () => {
    const store = createStore();
    logFirstCountervaluesLoad(store);
    store.dispatch(countervaluesLoadStarted());
    store.dispatch(countervaluesLoadSucceeded());

    store.dispatch(countervaluesLoadStarted());
    store.dispatch(countervaluesLoadSucceeded());

    expect(loggedEvents()).toEqual(["Countervalues first load done"]);
  });

  it("stops listening instead of throwing on a store without countervalues", () => {
    const store = configureStore({ reducer: { other: (state: number = 0) => state } });
    logFirstCountervaluesLoad(store as unknown as ReturnType<typeof createStore>);

    expect(() => store.dispatch({ type: "any" })).not.toThrow();
    expect(() => store.dispatch({ type: "any" })).not.toThrow();
    expect(loggedEvents()).toEqual([]);
  });
});
