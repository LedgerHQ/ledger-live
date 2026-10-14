import React from "react";
import { renderHook } from "@testing-library/react";
import { BigNumber } from "bignumber.js";
import {
  exportCountervalues,
  type CountervaluesSettings,
} from "@domain/entity-market-countervalues";
import { buildCV } from "@domain/entity-market-countervalues/mock";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { getFiatCurrencyByTicker } from "@domain/entity-currency-fiat";
import {
  CountervaluesProvider,
  useCalculate,
  useCalculateCountervalueCallback,
  useCountervaluesPolling,
  useCountervaluesState,
  useCountervaluesUserSettings,
  useSendAmount,
  type CountervaluesBridge,
  type Props,
} from "./CountervaluesProvider";

// Real provider and real hooks. The bridge never asks for a load, so nothing reaches the network.

const bitcoin = getCryptoCurrencyById("bitcoin");
const usd = getFiatCurrencyByTicker("USD");
const oneBitcoin = new BigNumber(10).pow(bitcoin.units[0].magnitude);
// 30,000 USD per BTC, in cents.
const thirtyThousandDollars = 3_000_000;

const state = buildCV({ pair: { from: bitcoin, to: usd }, latest: 30_000 });
const loadError = new Error("countervalues service unreachable");
// Stable, as the apps' selector is: a new array per render would re-arm the settings debounce.
const supportedCryptoIds: string[] = [];

function createBridge({
  isPolling = false,
  refreshRate = 60_000,
}: { isPolling?: boolean; refreshRate?: number } = {}): CountervaluesBridge {
  const settings: CountervaluesSettings = {
    trackingPairs: [],
    autofillGaps: true,
    refreshRate,
    marketCapBatchingAfterRank: 20,
  };
  return {
    rates: { fetchHistorical: jest.fn(), fetchLatest: jest.fn() },
    setPollingIsPolling: jest.fn(),
    setPollingTriggerLoad: jest.fn(),
    setState: jest.fn(),
    setStateError: jest.fn(),
    setStatePending: jest.fn(),
    useSupportedCryptoIds: () => supportedCryptoIds,
    usePollingIsPolling: () => isPolling,
    usePollingTriggerLoad: () => false,
    useStateError: () => loadError,
    useStatePending: () => true,
    useState: () => state,
    useUserSettings: () => settings,
    wipe: jest.fn(),
  };
}

function wrapperFor(bridge: CountervaluesBridge, props: Partial<Props> = {}) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(CountervaluesProvider, { ...props, bridge, children });
  };
}

describe("countervalues hooks", () => {
  it("read the provider's bridge", () => {
    const bridge = createBridge();
    const { result } = renderHook(
      () => ({
        state: useCountervaluesState(),
        polling: useCountervaluesPolling(),
        userSettings: useCountervaluesUserSettings(),
      }),
      { wrapper: wrapperFor(bridge) },
    );

    expect(result.current.state).toBe(state);
    expect(result.current.userSettings).toBe(bridge.useUserSettings());
    expect(result.current.polling).toMatchObject({ pending: true, error: loadError });
  });

  it("calculate from the provider's state", () => {
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
      { wrapper: wrapperFor(createBridge()) },
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

  it("drive the provider's bridge through the polling controls", () => {
    const bridge = createBridge();
    const { result } = renderHook(() => useCountervaluesPolling(), {
      wrapper: wrapperFor(bridge),
    });
    jest.mocked(bridge.setPollingTriggerLoad).mockClear();

    result.current.poll();
    result.current.start();
    result.current.stop();
    result.current.wipe();

    expect(jest.mocked(bridge.setPollingTriggerLoad).mock.calls).toEqual([[true]]);
    expect(jest.mocked(bridge.setPollingIsPolling).mock.calls).toEqual([[true], [false]]);
    expect(bridge.wipe).toHaveBeenCalledTimes(1);
  });

  it("throw outside a provider", () => {
    jest.spyOn(console, "error").mockImplementation(() => {});

    expect(() => renderHook(() => useCountervaluesState())).toThrow(
      "'useCountervaluesBridgeContext' must be used within a 'CountervaluesProvider'",
    );
  });
});

describe("CountervaluesProvider", () => {
  afterEach(() => {
    jest.useRealTimers();
  });

  it("restores a saved state into the bridge", () => {
    const bridge = createBridge();
    const savedState = exportCountervalues(state, [
      { from: bitcoin, to: usd, startDate: new Date("2026-06-19T00:00:00.000Z") },
    ]);
    const [savedPair] = Object.keys(savedState).filter(key => key !== "status");
    expect(savedPair).toBeDefined();

    renderHook(() => null, { wrapper: wrapperFor(bridge, { savedState }) });

    expect(bridge.setState).toHaveBeenCalledTimes(1);
    const restored = jest.mocked(bridge.setState).mock.calls[0][0];
    expect(Object.fromEntries(restored.data[savedPair])).toEqual(savedState[savedPair]);
    expect(restored.checkHolesOnNextLoad).toBe(true);
  });

  it("asks for a load after the initial delay, then at every refresh", () => {
    jest.useFakeTimers();
    const bridge = createBridge({ isPolling: true, refreshRate: 60_000 });
    renderHook(() => null, { wrapper: wrapperFor(bridge, { pollInitDelay: 3_000 }) });
    const triggerLoad = jest.mocked(bridge.setPollingTriggerLoad);
    triggerLoad.mockClear();

    jest.advanceTimersByTime(2_999);
    expect(triggerLoad).not.toHaveBeenCalled();
    jest.advanceTimersByTime(1);
    expect(triggerLoad).toHaveBeenCalledTimes(1);
    jest.advanceTimersByTime(60_000);
    expect(triggerLoad).toHaveBeenCalledTimes(2);
  });

  it("does not poll before a refresh rate arrives", () => {
    jest.useFakeTimers();
    const bridge = createBridge({ isPolling: true, refreshRate: 0 });
    renderHook(() => null, { wrapper: wrapperFor(bridge, { pollInitDelay: 3_000 }) });
    const triggerLoad = jest.mocked(bridge.setPollingTriggerLoad);
    triggerLoad.mockClear();

    jest.advanceTimersByTime(120_000);

    expect(triggerLoad).not.toHaveBeenCalled();
  });
});
