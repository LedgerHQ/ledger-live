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
  formatCounterValueHour,
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
import { startOfHour } from "../ranges";
import { useBalanceHistoryWithCountervalue } from "../portfolioReact";

// The hook on a real countervalues store, fed by the real loadCountervalues. The clock stays frozen
// between loads unless a step moves it, so a load can bring the same rates again.

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
// rates: this source gives one per hour up to now, as the service does.
const mockRates = createMockRateSource("1");
let latestShift = 0;
let holdLatest = false;
let lastLatest: Array<number | null | undefined> = [];
const rates: RateSource = {
  async fetchHistorical(granularity, pair, granularitiesRates) {
    if (granularity !== "hourly") {
      return mockRates.fetchHistorical(granularity, pair, granularitiesRates);
    }
    const hourly: Record<string, number> = {};
    for (let t = startOfHour(pair.startDate).getTime(); t <= Date.now(); t += HOUR) {
      hourly[formatCounterValueHour(new Date(t))] = 9_000 + ((t / HOUR) % 100);
    }
    return hourly;
  },
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
  it("recomputes when a load moves the latest rate or brings a new hour, and only then", async () => {
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

    // The same rates again: only the status moves.
    const before = store.getState().countervalues.rates;
    await load();
    expect(store.getState().countervalues.rates).not.toBe(before);
    expect(renders).toBe(1);
    expect(result.current).toBe(initial);

    // Only the latest rate moves: "now" and the points after the last past rate read it.
    latestShift = 1_000;
    await load();
    expect(renders).toBe(2);
    expect(result.current).toEqual(fromFullState());
    expect(now(result.current)).not.toBe(now(initial));
    const latestMoved = result.current;

    // An hour later, the latest rates held: the load brings that hour's rate alone, and the history
    // moves to the new hour.
    holdLatest = true;
    timemachine.config({ timestamp: Date.now() + HOUR });
    const beforeHour = store.getState().countervalues.rates;
    await load();
    expect(latestOf(store.getState().countervalues.rates)).toEqual(latestOf(beforeHour));
    expect(renders).toBe(3);
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
