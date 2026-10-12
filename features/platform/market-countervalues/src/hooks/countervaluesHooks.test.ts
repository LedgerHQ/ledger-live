import React from "react";
import { act, renderHook } from "@testing-library/react";
import { configureStore, type Middleware, type UnknownAction } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import { BigNumber } from "bignumber.js";
import { wipeCountervalues } from "@domain/entity-market-countervalues";
import { buildCV } from "@domain/entity-market-countervalues/mock";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { getFiatCurrencyByTicker } from "@domain/entity-currency-fiat";
import {
  useCalculate,
  useCalculateCountervalueCallback,
  useCountervaluesLoadStatus,
  useCountervaluesPolling,
  useCountervaluesState,
  useSendAmount,
} from "./countervaluesHooks";
import { countervaluesInitialState, countervaluesReducer } from "../state/reducer";
import {
  setCountervaluesPollingIsPolling,
  setCountervaluesPollingTriggerLoad,
  setCountervaluesStateError,
  setCountervaluesStatePending,
} from "../state/slice";

// Real hooks on a real store. Nothing runs the polling loop, so nothing reaches the network.

const bitcoin = getCryptoCurrencyById("bitcoin");
const usd = getFiatCurrencyByTicker("USD");
const oneBitcoin = new BigNumber(10).pow(bitcoin.units[0].magnitude);
// 30,000 USD per BTC, in cents.
const thirtyThousandDollars = 3_000_000;

const state = buildCV({ pair: { from: bitcoin, to: usd }, latest: 30_000 });
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
        sync: { ...countervaluesInitialState.sync, pending: true, error: loadError },
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
      store.dispatch(setCountervaluesStatePending(false));
      store.dispatch(setCountervaluesStatePending(true));
      store.dispatch(setCountervaluesStateError(new Error("again")));
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
      store.dispatch(setCountervaluesPollingTriggerLoad(true));
      store.dispatch({ type: "UNRELATED" });
    });
    expect(renders).toBe(1);
    expect(result.current).toBe(initial);

    // A load starts: pending stays true and the error clears. Then it fails.
    const nextError = new Error("again");
    act(() => {
      store.dispatch(setCountervaluesStatePending(true));
    });
    expect(renders).toBe(2);
    expect(result.current).toEqual({ pending: true, error: null });

    act(() => {
      store.dispatch(setCountervaluesStateError(nextError));
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

    expect(
      dispatched.filter(setCountervaluesPollingTriggerLoad.match).map(a => [a.payload]),
    ).toEqual([[true]]);
    expect(dispatched.filter(setCountervaluesPollingIsPolling.match).map(a => [a.payload])).toEqual(
      [[true], [false]],
    );
    expect(dispatched.filter(wipeCountervalues.match)).toHaveLength(1);
  });

  it("throw outside a Redux provider", () => {
    jest.spyOn(console, "error").mockImplementation(() => {});

    expect(() => renderHook(() => useCountervaluesState())).toThrow(
      "could not find react-redux context value",
    );
  });
});
