/**
 * @jest-environment jsdom
 */
import "@ledgerhq/ledger-wallet-framework/test-helpers/staticTime";
import React from "react";
import timemachine from "timemachine";
import { act, renderHook } from "@testing-library/react";
import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import {
  setCountervaluesState,
  type CounterValuesState,
  type CountervaluesSettings,
} from "@domain/entity-market-countervalues";
import { loadCountervalues, type RateSource } from "@domain/api-market-countervalues";
import { createMockRateSource } from "@domain/api-market-countervalues/mock";
import { countervaluesReducer } from "@features/platform-market-countervalues";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { getCryptoCurrencyById, getFiatCurrencyByTicker } from "./currencies";
import { inferTrackingPairForAccounts } from "../trackingPairs";
import { getBalanceHistoryWithCountervalue, getPortfolioCount } from "../portfolio";
import { useBalanceHistoryWithCountervalue } from "../portfolioReact";

// The hook on a real countervalues store, fed by the real loadCountervalues. Its history is dated
// from the clock, so it recomputes on every load, including one that brings nothing new: the load
// is what moves the history to the current hour. The clock stays frozen between loads unless a
// step moves it.

const HOUR = 60 * 60 * 1000;
const account = genAccount("bitcoin_1", { currency: getCryptoCurrencyById("bitcoin") });
const usd = getFiatCurrencyByTicker("USD");
const range = "week";
const count = getPortfolioCount([account], range);
const settings: CountervaluesSettings = {
  trackingPairs: inferTrackingPairForAccounts([account], usd),
  autofillGaps: true,
  refreshRate: 60_000,
  marketCapBatchingAfterRank: 20,
};

// The mock rates, with every latest rate shifted by what the test sets. The mock moves its latest
// rates with the clock, so a step can hold the ones the previous load fetched. It has no hourly
// rates, so a load an hour later with the latest held brings nothing new.
const mockRates = createMockRateSource("1");
let latestShift = 0;
let holdLatest = false;
let lastLatest: Array<number | null | undefined> = [];
const rates: RateSource = {
  fetchHistorical: (...args) => mockRates.fetchHistorical(...args),
  async fetchLatest(...args) {
    if (holdLatest) return lastLatest;
    const fetched = await mockRates.fetchLatest(...args);
    lastLatest = fetched.map(v => (typeof v === "number" ? v + latestShift : v));
    return lastLatest;
  },
};

const start = Date.now();

afterAll(() => {
  timemachine.config({ timestamp: start });
});

describe("useBalanceHistoryWithCountervalue on a countervalues store", () => {
  it("recomputes on every load, also one that brings nothing new in a new hour", async () => {
    const store = configureStore({
      reducer: { countervalues: countervaluesReducer },
      // The state holds rate Maps.
      middleware: getDefault => getDefault({ serializableCheck: false, immutableCheck: false }),
    });
    await load();
    let renders = 0;
    const { result } = renderHook(
      () => {
        renders++;
        return useBalanceHistoryWithCountervalue({ account, range, to: usd });
      },
      {
        wrapper: ({ children }: { children: React.ReactNode }) => (
          <Provider store={store}>{children}</Provider>
        ),
      },
    );
    const initial = result.current;
    expect(initial.countervalueAvailable).toBe(true);
    expect(initial).toEqual(fromFullState());

    // The same rates again.
    await load();
    expect(renders).toBe(2);
    expect(result.current).toEqual(initial);

    // Only the latest rate moves: "now" and the points after the last past rate read it.
    latestShift = 1_000;
    await load();
    expect(renders).toBe(3);
    expect(result.current).toEqual(fromFullState());
    expect(now(result.current)).not.toBe(now(initial));
    const latestMoved = result.current;

    // An hour later, the latest rates held: the load brings nothing new, yet the history moves to
    // the new hour.
    holdLatest = true;
    timemachine.config({ timestamp: Date.now() + HOUR });
    const beforeHour = store.getState().countervalues.rates;
    await load();
    const afterHour = store.getState().countervalues.rates;
    expect(afterHour.cache).toBe(beforeHour.cache);
    expect(latestOf(afterHour)).toEqual(latestOf(beforeHour));
    expect(renders).toBe(4);
    expect(result.current).toEqual(fromFullState());
    expect(result.current.history.at(-1)?.date.getTime()).toBe(Date.now());
    expect(result.current.history.at(-1)?.date).not.toEqual(latestMoved.history.at(-1)?.date);

    async function load() {
      const next = await loadCountervalues(store.getState().countervalues.rates, settings, {
        rates,
      });
      act(() => {
        store.dispatch(setCountervaluesState(next));
      });
    }

    function fromFullState() {
      const state = store.getState().countervalues.rates;
      return getBalanceHistoryWithCountervalue(account, range, count, state, usd);
    }
  });
});

function now({ history }: ReturnType<typeof getBalanceHistoryWithCountervalue>) {
  return history.at(-1)?.countervalue;
}

function latestOf({ data }: CounterValuesState) {
  return Object.values(data).map(map => map.get("latest"));
}
