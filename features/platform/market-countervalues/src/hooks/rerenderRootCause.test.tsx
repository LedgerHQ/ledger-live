// MEASUREMENT BRANCH ONLY, NEVER MERGE.
// Checks the three root-cause claims behind the remaining countervalues re-renders, each with a
// control that proves the check can see the opposite outcome.
import React from "react";
import { act, renderHook } from "@testing-library/react";
import { configureStore } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import {
  calculate,
  pairId,
  setCountervaluesState,
  type CounterValuesState,
  type CountervaluesSettings,
} from "@domain/entity-market-countervalues";
import { buildMultiCV } from "@domain/entity-market-countervalues/mock";
import { loadCountervalues, type RateSource } from "@domain/api-market-countervalues";
import type { Currency } from "@domain/entity-currency";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { getFiatCurrencyByTicker } from "@domain/entity-currency-fiat";
import { useCalculate, useCountervaluesState } from "./countervaluesHooks";
import { countervaluesInitialState, countervaluesReducer } from "../state/reducer";

jest.mock("@domain/entity-market-countervalues", () => {
  const actual = jest.requireActual("@domain/entity-market-countervalues");
  return { ...actual, calculate: jest.fn(actual.calculate) };
});

const DAY = 24 * 60 * 60 * 1000;
const bitcoin = getCryptoCurrencyById("bitcoin");
const ethereum = getCryptoCurrencyById("ethereum");
const usd = getFiatCurrencyByTicker("USD");
const btcUsd = pairId({ from: bitcoin, to: usd });
const ethUsd = pairId({ from: ethereum, to: usd });
const latest: Record<string, number> = { [btcUsd]: 30_000, [ethUsd]: 2_000 };

// earliestStableDate decides where the next history window starts: now means nothing to fetch.
function stateWithStableHistoryUpTo(stableUpTo: Date): CounterValuesState {
  const state = buildMultiCV([
    { pair: { from: bitcoin, to: usd }, latest: latest[btcUsd] },
    { pair: { from: ethereum, to: usd }, latest: latest[ethUsd] },
  ]);
  for (const id of Object.keys(state.cache)) {
    const stats = state.cache[id].stats;
    if (stats) stats.earliestStableDate = stableUpTo;
  }
  return state;
}

function settingsFor(startDate: Date): CountervaluesSettings {
  return {
    trackingPairs: [
      { from: bitcoin, to: usd, startDate },
      { from: ethereum, to: usd, startDate },
    ],
    autofillGaps: true,
    refreshRate: 60_000,
    marketCapBatchingAfterRank: 20,
  };
}

// Answers the latest from `latestNow` and an empty window for any history request.
function stubRates(latestNow: Record<string, number>) {
  const rates = {
    fetchHistorical: jest.fn(async () => ({})),
    fetchLatest: jest.fn(async (pairs: { from: Currency; to: Currency }[]) =>
      pairs.map(pair => latestNow[pairId(pair)]),
    ),
  };
  return rates as typeof rates & RateSource;
}

function load(state: CounterValuesState, settings: CountervaluesSettings, rates: RateSource) {
  return loadCountervalues(state, settings, { rates, batchStrategySolver: undefined as never });
}

function storeWith(rates: CounterValuesState) {
  return configureStore({
    reducer: { countervalues: countervaluesReducer },
    preloadedState: { countervalues: { rates, sync: countervaluesInitialState.sync } },
    middleware: getDefault => getDefault({ serializableCheck: false, immutableCheck: false }),
  });
}

function wrapperFor(store: ReturnType<typeof storeWith>) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(Provider, { store, children });
  };
}

describe("root cause of the remaining countervalues re-renders", () => {
  it("a load that changes nothing still returns a new state object, which re-renders consumers", async () => {
    const now = new Date();
    const state = stateWithStableHistoryUpTo(now);
    const rates = stubRates(latest);

    const next = await load(state, settingsFor(now), rates);

    // The load ran, asked for no history and got back the latest values it already had.
    expect(rates.fetchLatest).toHaveBeenCalledTimes(1);
    expect(rates.fetchHistorical).not.toHaveBeenCalled();
    expect(next.data[btcUsd]).toBe(state.data[btcUsd]);
    expect(next.data[ethUsd]).toBe(state.data[ethUsd]);
    // Claim: a new object anyway.
    expect(next).not.toBe(state);

    const store = storeWith(state);
    let renders = 0;
    renderHook(
      () => {
        renders++;
        return useCountervaluesState();
      },
      { wrapper: wrapperFor(store) },
    );
    const mounted = renders;

    // Control: storing the same object renders nothing, so the counter can see a non-render.
    act(() => {
      store.dispatch(setCountervaluesState(state));
    });
    expect(renders - mounted).toBe(0);

    act(() => {
      store.dispatch(setCountervaluesState(next));
    });
    expect(renders - mounted).toBe(1);
  });

  it("an unchanged pair keeps its data and cache objects, a moved pair gets new ones", async () => {
    const now = new Date();
    const state = stateWithStableHistoryUpTo(now);
    const rates = stubRates({ ...latest, [ethUsd]: latest[ethUsd] + 1 });

    const next = await load(state, settingsFor(now), rates);

    expect(next.data[btcUsd]).toBe(state.data[btcUsd]);
    expect(next.cache[btcUsd]).toBe(state.cache[btcUsd]);
    // Control: the pair whose latest moved.
    expect(next.data[ethUsd]).not.toBe(state.data[ethUsd]);
    expect(next.cache[ethUsd]).not.toBe(state.cache[ethUsd]);
    expect(next.data[ethUsd].get("latest")).toBe(latest[ethUsd] + 1);
  });

  it("a history request that brings nothing new still replaces the pair's data and cache", async () => {
    const twoDaysAgo = new Date(Date.now() - 2 * DAY);
    const state = stateWithStableHistoryUpTo(twoDaysAgo);
    const rates = stubRates(latest);

    const next = await load(state, settingsFor(twoDaysAgo), rates);

    expect(rates.fetchHistorical).toHaveBeenCalled();
    // Same content...
    expect([...next.data[btcUsd]]).toEqual([...state.data[btcUsd]]);
    expect(next.data[btcUsd].get("latest")).toBe(latest[btcUsd]);
    // ...new objects, so a selector on data[pairId] would still see a change.
    expect(next.data[btcUsd]).not.toBe(state.data[btcUsd]);
    expect(next.cache[btcUsd]).not.toBe(state.cache[btcUsd]);
  });

  describe("useCalculate", () => {
    const calculateMock = jest.mocked(calculate);
    const stableQuery = { value: 100_000_000, from: bitcoin, to: usd };

    beforeEach(() => {
      calculateMock.mockClear();
    });

    it("recomputes on every render when the query is passed inline", () => {
      const store = storeWith(stateWithStableHistoryUpTo(new Date()));
      const { rerender } = renderHook(
        () => useCalculate({ value: 100_000_000, from: bitcoin, to: usd }),
        { wrapper: wrapperFor(store) },
      );
      const afterMount = calculateMock.mock.calls.length;

      rerender();
      rerender();

      expect(afterMount).toBe(1);
      expect(calculateMock.mock.calls.length - afterMount).toBe(2);
    });

    it("control: reuses the result when the query object is stable", () => {
      const store = storeWith(stateWithStableHistoryUpTo(new Date()));
      const { rerender } = renderHook(() => useCalculate(stableQuery), {
        wrapper: wrapperFor(store),
      });
      const afterMount = calculateMock.mock.calls.length;

      rerender();
      rerender();

      expect(afterMount).toBe(1);
      expect(calculateMock.mock.calls.length - afterMount).toBe(0);
    });
  });
});
