import {
  initialState,
  type CountervaluesSettings,
  type CounterValuesState,
} from "@domain/entity-market-countervalues";
import { loadCountervalues, type RateSource } from "@domain/api-market-countervalues";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { getFiatCurrencyByTicker } from "@domain/entity-currency-fiat";
import {
  countervaluesInitialState,
  countervaluesPollingIsPollingSelector,
  countervaluesPollingTriggerLoadSelector,
  countervaluesReducer,
  countervaluesStateErrorSelector,
  countervaluesStatePendingSelector,
  countervaluesStateSelector,
  countervaluesUserSettingsSelector,
  setCountervaluesPollingIsPolling,
  setCountervaluesPollingTriggerLoad,
  setCountervaluesState,
  setCountervaluesStateError,
  setCountervaluesStatePending,
  setCountervaluesUserSettings,
  wipeCountervalues,
  type CountervaluesState,
} from ".";

const settings: CountervaluesSettings = {
  trackingPairs: [
    {
      from: getCryptoCurrencyById("bitcoin"),
      to: getFiatCurrencyByTicker("USD"),
      startDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
    },
  ],
  autofillGaps: true,
  refreshRate: 60000,
  marketCapBatchingAfterRank: 100,
};

const loadedState: CounterValuesState = {
  data: { "bitcoin USD": new Map([["latest", 1]]) },
  status: {},
  cache: {},
};

const errored: CountervaluesState = {
  ...countervaluesInitialState,
  countervalues: { state: loadedState, pending: false, error: new Error("network") },
};

describe("countervaluesReducer", () => {
  it("starts from the initial state", () => {
    const state = countervaluesReducer(undefined, { type: "@@INIT" });

    expect(state).toBe(countervaluesInitialState);
    expect(state.countervalues.state).toBe(initialState);
  });

  it("returns the same state for an unrelated action", () => {
    expect(countervaluesReducer(errored, { type: "UNRELATED" })).toBe(errored);
  });

  it.each([
    [setCountervaluesPollingIsPolling, "COUNTERVALUES_POLLING_SET_IS_POLLING"],
    [setCountervaluesPollingTriggerLoad, "COUNTERVALUES_POLLING_SET_TRIGGER_LOAD"],
    [setCountervaluesState, "COUNTERVALUES_STATE_SET"],
    [setCountervaluesStateError, "COUNTERVALUES_STATE_SET_ERROR"],
    [setCountervaluesStatePending, "COUNTERVALUES_STATE_SET_PENDING"],
    [setCountervaluesUserSettings, "COUNTERVALUES_USER_SETTINGS_SET"],
    [wipeCountervalues, "COUNTERVALUES_WIPE"],
  ])("keeps the action type string %#: %s", (creator, type) => {
    expect(creator.type).toBe(type);
  });

  it("sets polling flags", () => {
    let state = countervaluesReducer(
      countervaluesInitialState,
      setCountervaluesPollingIsPolling(false),
    );
    state = countervaluesReducer(state, setCountervaluesPollingTriggerLoad(true));

    expect(state.polling).toEqual({ isPolling: false, triggerLoad: true });
    expect(state.countervalues).toBe(countervaluesInitialState.countervalues);
  });

  it("sets the rate state", () => {
    const state = countervaluesReducer(
      countervaluesInitialState,
      setCountervaluesState(loadedState),
    );

    expect(state.countervalues.state).toBe(loadedState);
    expect(state.polling).toBe(countervaluesInitialState.polling);
  });

  it("stores an error and stops pending", () => {
    const pending = countervaluesReducer(
      countervaluesInitialState,
      setCountervaluesStatePending(true),
    );
    const error = new Error("network");
    const state = countervaluesReducer(pending, setCountervaluesStateError(error));

    expect(state.countervalues.error).toBe(error);
    expect(state.countervalues.pending).toBe(false);
  });

  it("clears the error when a load starts", () => {
    const state = countervaluesReducer(errored, setCountervaluesStatePending(true));

    expect(state.countervalues.pending).toBe(true);
    expect(state.countervalues.error).toBeNull();
  });

  it("keeps the error when pending ends", () => {
    const state = countervaluesReducer(errored, setCountervaluesStatePending(false));

    expect(state.countervalues.error).toBe(errored.countervalues.error);
  });

  it("sets the user settings", () => {
    const state = countervaluesReducer(
      countervaluesInitialState,
      setCountervaluesUserSettings(settings),
    );

    expect(state.userSettings).toBe(settings);
  });

  it("wipes rates, pending and error but keeps polling and user settings", () => {
    const populated: CountervaluesState = {
      countervalues: { state: loadedState, pending: true, error: new Error("network") },
      polling: { isPolling: false, triggerLoad: true },
      userSettings: settings,
    };
    const state = countervaluesReducer(populated, wipeCountervalues());

    expect(state.countervalues).toEqual({ state: initialState, pending: false, error: null });
    expect(state.polling).toBe(populated.polling);
    expect(state.userSettings).toBe(settings);
  });

  it("reads every field through its selector", () => {
    const root = { countervalues: errored };

    expect(countervaluesStateSelector(root)).toBe(loadedState);
    expect(countervaluesStatePendingSelector(root)).toBe(false);
    expect(countervaluesStateErrorSelector(root)).toBe(errored.countervalues.error);
    expect(countervaluesPollingIsPollingSelector(root)).toBe(true);
    expect(countervaluesPollingTriggerLoadSelector(root)).toBe(false);
    expect(countervaluesUserSettingsSelector(root)).toBe(errored.userSettings);
  });

  it("does not freeze the stored rates", () => {
    const rateMap = new Map([["latest", 1]]);
    const stored = countervaluesReducer(
      countervaluesInitialState,
      setCountervaluesState({ data: { "bitcoin USD": rateMap }, status: {}, cache: {} }),
    );

    expect(Object.isFrozen(stored.countervalues.state)).toBe(false);
    expect(Object.isFrozen(initialState)).toBe(false);
    expect(() => rateMap.set("latest", 2)).not.toThrow();
  });

  // loadCountervalues updates the rate Maps of the state it is given in place.
  it("lets loadCountervalues update a stored state twice", async () => {
    let latest = 100;
    const rates: RateSource = {
      fetchHistorical: async () => ({}),
      fetchLatest: async pairs => pairs.map(() => ++latest),
    };
    let store = countervaluesReducer(undefined, { type: "@@INIT" });

    for (let poll = 0; poll < 2; poll++) {
      const next = await loadCountervalues(
        countervaluesStateSelector({ countervalues: store }),
        settings,
        {
          rates,
        },
      );
      store = countervaluesReducer(store, setCountervaluesState(next));
    }

    const [pair] = Object.values(countervaluesStateSelector({ countervalues: store }).data);
    expect(pair.get("latest")).toBe(102);
  });
});
