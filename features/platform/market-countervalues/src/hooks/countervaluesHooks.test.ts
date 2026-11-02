import React from "react";
import { act, renderHook } from "@testing-library/react";
import { configureStore, type Middleware, type UnknownAction } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import { BigNumber } from "bignumber.js";
import {
  applyRatePatches,
  pairId,
  setCountervaluesState,
  wipeCountervalues,
  type CountervaluesSettings,
} from "@domain/entity-market-countervalues";
import { buildCV } from "@domain/entity-market-countervalues/mock";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { getFiatCurrencyByTicker } from "@domain/entity-currency-fiat";
import {
  useCalculate,
  useCalculateCountervalueCallback,
  useCountervaluesCache,
  useCountervaluesLoadStatus,
  useCountervaluesPolling,
  useCountervaluesState,
  useSendAmount,
} from "./countervaluesHooks";
import { countervaluesInitialState, countervaluesReducer } from "../state/reducer";
import {
  countervaluesLoadFailed,
  countervaluesLoadRequested,
  countervaluesLoadStarted,
  countervaluesLoadSucceeded,
  countervaluesPollingSet,
} from "../state/slice";

// Real hooks on a real store. Nothing runs the polling loop, so nothing reaches the network.

const bitcoin = getCryptoCurrencyById("bitcoin");
const usd = getFiatCurrencyByTicker("USD");
const oneBitcoin = new BigNumber(10).pow(bitcoin.units[0].magnitude);
// 30,000 USD per BTC, in cents.
const thirtyThousandDollars = 3_000_000;

const state = buildCV({ pair: { from: bitcoin, to: usd }, latest: 30_000 });
const btcUsd = pairId({ from: bitcoin, to: usd });
const settings: CountervaluesSettings = {
  trackingPairs: [],
  autofillGaps: true,
  refreshRate: 60_000,
  marketCapBatchingAfterRank: 20,
};
const loadError = new Error("countervalues service unreachable");

function createTestStore() {
  const dispatched: UnknownAction[] = [];
  const record: Middleware = () => next => action => {
    dispatched.push(action as UnknownAction);
    return next(action);
  };
  const store = configureStore({
    reducer: { countervalues: countervaluesReducer },
    preloadedState: {
      countervalues: {
        rates: state,
        sync: { ...countervaluesInitialState.sync, load: "loading" as const, error: loadError },
      },
    },
    // The state holds an Error and rate Maps.
    middleware: getDefault =>
      getDefault({ serializableCheck: false, immutableCheck: false }).concat(record),
  });
  return { store, dispatched };
}

function wrapperFor(store: ReturnType<typeof createTestStore>["store"]) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    // oxlint-disable-next-line react/no-children-prop
    return React.createElement(Provider, { store, children });
  };
}

describe("countervalues hooks", () => {
  it("read the store", () => {
    const { store } = createTestStore();
    const { result } = renderHook(
      () => ({
        state: useCountervaluesState(),
        loadStatus: useCountervaluesLoadStatus(),
      }),
      { wrapper: wrapperFor(store) },
    );

    expect(result.current.state).toBe(state);
    expect(result.current.loadStatus).toEqual({ pending: true, error: loadError });
  });

  it("re-render the cache view only when the rates' cache changes", () => {
    const { store } = createTestStore();
    const renders = { cache: 0, state: 0 };
    const wrapper = wrapperFor(store);
    const cacheView = renderHook(
      () => {
        renders.cache++;
        return useCountervaluesCache();
      },
      { wrapper },
    );
    renderHook(
      () => {
        renders.state++;
        return useCountervaluesState();
      },
      { wrapper },
    );
    const initial = cacheView.result.current;
    expect(initial).toEqual({ cache: state.cache });

    // A load that only stamps the status.
    act(() => {
      store.dispatch(setCountervaluesState({ ...state, status: { stamped: { timestamp: 1 } } }));
    });
    expect(renders.cache).toBe(1);
    expect(cacheView.result.current).toBe(initial);
    // Control: the full state did see the load.
    expect(renders.state).toBe(2);

    act(() => {
      store.dispatch(wipeCountervalues());
    });
    expect(renders.cache).toBe(2);
    expect(cacheView.result.current).toEqual({ cache: {} });
  });

  it("re-render the conversions when a load moves only the latest rate", () => {
    const { store } = createTestStore();
    let renders = 0;
    const { result } = renderHook(
      () => {
        renders++;
        return {
          view: useCountervaluesCache(),
          calculated: useCalculate({ value: oneBitcoin.toNumber(), from: bitcoin, to: usd }),
        };
      },
      { wrapper: wrapperFor(store) },
    );
    expect(result.current.calculated).toBe(thirtyThousandDollars);

    act(() => {
      store.dispatch(setCountervaluesState(loadLatest(31_000)));
    });
    expect(renders).toBe(2);
    expect(result.current.calculated).toBe(3_100_000);
    const moved = result.current;

    // Control: the same latest again keeps the view, so the re-render above came from the rate.
    act(() => {
      store.dispatch(setCountervaluesState(loadLatest(31_000)));
    });
    expect(renders).toBe(2);
    expect(result.current).toBe(moved);

    function loadLatest(latest: number) {
      const { rates } = store.getState().countervalues;
      const status = { [btcUsd]: { timestamp: Date.now() } };
      return applyRatePatches(rates, { ...rates, status }, [{ [btcUsd]: { latest } }], settings);
    }
  });

  it("keep the polling controls stable through a load cycle, without re-rendering", () => {
    const { store } = createTestStore();
    let renders = 0;
    const { result } = renderHook(
      () => {
        renders++;
        return useCountervaluesPolling();
      },
      { wrapper: wrapperFor(store) },
    );
    const controls = result.current;

    act(() => {
      store.dispatch(countervaluesLoadSucceeded());
      store.dispatch(countervaluesLoadStarted());
      store.dispatch(countervaluesLoadFailed(new Error("again")));
    });

    expect(renders).toBe(1);
    expect(result.current).toBe(controls);
    expect(Object.keys(controls).sort()).toEqual(["poll", "start", "stop", "wipe"]);
  });

  it("re-render the load status only when pending or the error changes", () => {
    const { store } = createTestStore();
    let renders = 0;
    const { result } = renderHook(
      () => {
        renders++;
        return useCountervaluesLoadStatus();
      },
      { wrapper: wrapperFor(store) },
    );
    const initial = result.current;

    act(() => {
      store.dispatch(countervaluesLoadRequested());
      store.dispatch({ type: "UNRELATED" });
    });
    expect(renders).toBe(1);
    expect(result.current).toBe(initial);

    // A load starts: pending stays true and the error clears. Then it fails.
    const nextError = new Error("again");
    act(() => {
      store.dispatch(countervaluesLoadStarted());
    });
    expect(renders).toBe(2);
    expect(result.current).toEqual({ pending: true, error: null });

    act(() => {
      store.dispatch(countervaluesLoadFailed(nextError));
    });
    expect(renders).toBe(3);
    expect(result.current).toEqual({ pending: false, error: nextError });
  });

  it("calculate from the store's state", () => {
    const { store } = createTestStore();
    const { result } = renderHook(
      () => ({
        calculated: useCalculate({ value: oneBitcoin.toNumber(), from: bitcoin, to: usd }),
        calculateCallback: useCalculateCountervalueCallback({ to: usd }),
        sendAmount: useSendAmount({
          cryptoCurrency: bitcoin,
          fiatCurrency: usd,
          cryptoAmount: oneBitcoin,
        }),
      }),
      { wrapper: wrapperFor(store) },
    );
    const { calculated, calculateCallback, sendAmount } = result.current;

    expect(calculated).toBe(thirtyThousandDollars);
    expect(calculateCallback(bitcoin, oneBitcoin)?.toNumber()).toBeCloseTo(thirtyThousandDollars);
    expect(sendAmount.fiatAmount.toNumber()).toBeCloseTo(thirtyThousandDollars);
    expect(sendAmount.fiatUnit).toBe(usd.units[0]);
    expect(sendAmount.calculateCryptoAmount(new BigNumber(thirtyThousandDollars)).toNumber()).toBe(
      oneBitcoin.toNumber(),
    );
  });

  it("drive the store through the polling controls", () => {
    const { store, dispatched } = createTestStore();
    const { result } = renderHook(() => useCountervaluesPolling(), {
      wrapper: wrapperFor(store),
    });

    act(() => {
      result.current.poll();
      result.current.start();
      result.current.stop();
      result.current.wipe();
    });

    expect(dispatched.filter(countervaluesLoadRequested.match)).toHaveLength(1);
    expect(dispatched.filter(countervaluesPollingSet.match).map(a => [a.payload])).toEqual([
      [true],
      [false],
    ]);
    expect(dispatched.filter(wipeCountervalues.match)).toHaveLength(1);
  });

  it("throw outside a Redux provider", () => {
    jest.spyOn(console, "error").mockImplementation(() => {});

    expect(() => renderHook(() => useCountervaluesState())).toThrow(
      "could not find react-redux context value",
    );
  });
});
