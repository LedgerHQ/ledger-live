import React from "react";
import { act, renderHook } from "@testing-library/react";
import { configureStore, type Middleware, type UnknownAction } from "@reduxjs/toolkit";
import { Provider } from "react-redux";
import { BigNumber } from "bignumber.js";
import { buildCV } from "@domain/entity-market-countervalues/mock";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { getFiatCurrencyByTicker } from "@domain/entity-currency-fiat";
import {
  useCalculate,
  useCalculateCountervalueCallback,
  useCountervaluesPolling,
  useCountervaluesState,
  useSendAmount,
} from "./countervaluesHooks";
import {
  countervaluesInitialState,
  countervaluesReducer,
  setCountervaluesPollingIsPolling,
  setCountervaluesPollingTriggerLoad,
  wipeCountervalues,
  type CountervaluesState,
} from "./countervaluesSlice";

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
  const countervalues: CountervaluesState = {
    ...countervaluesInitialState,
    countervalues: { state, pending: true, error: loadError },
  };
  const store = configureStore({
    reducer: { countervalues: countervaluesReducer },
    preloadedState: { countervalues },
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
        polling: useCountervaluesPolling(),
      }),
      { wrapper: wrapperFor(store) },
    );

    expect(result.current.state).toBe(state);
    expect(result.current.polling).toMatchObject({ pending: true, error: loadError });
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
