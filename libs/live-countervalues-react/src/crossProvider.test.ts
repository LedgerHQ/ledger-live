import React from "react";
import { renderHook } from "@testing-library/react";
import { BigNumber } from "bignumber.js";
import type { CountervaluesSettings } from "@domain/entity-market-countervalues";
import { buildCV } from "@domain/entity-market-countervalues/mock";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import type { FiatCurrency } from "@ledgerhq/ledger-wallet-framework/types";
import * as platform from "@features/platform-market-countervalues";
import * as legacy from ".";

// Consumers move from this package to the platform one a file at a time, so either provider must
// serve both packages' hooks. Real providers and real hooks: the bridge never asks for a load, so
// nothing reaches the network and nothing needs mocking.

type Hooks = Pick<
  typeof legacy,
  | "useCountervaluesState"
  | "useCountervaluesPolling"
  | "useCountervaluesUserSettings"
  | "useCalculate"
  | "useCalculateCountervalueCallback"
  | "useSendAmount"
>;
type Provider = typeof legacy.CountervaluesProvider;

const usd: FiatCurrency = {
  type: "FiatCurrency",
  name: "US Dollar",
  ticker: "USD",
  symbol: "$",
  units: [{ name: "dollar", code: "USD", magnitude: 2, showAllDigits: true, prefixCode: true }],
};
const bitcoin = genAccount("bitcoin").currency;
const oneBitcoin = new BigNumber(10).pow(bitcoin.units[0].magnitude);
// 30,000 USD per BTC, in cents.
const thirtyThousandDollars = 3_000_000;

const state = buildCV({ pair: { from: bitcoin, to: usd }, latest: 30_000 });
const settings: CountervaluesSettings = {
  trackingPairs: [],
  autofillGaps: true,
  refreshRate: 60_000,
  marketCapBatchingAfterRank: 20,
};
const loadError = new Error("countervalues service unreachable");
// Stable, as the apps' selector is: a new array per render would re-arm the settings debounce.
const supportedCryptoIds: string[] = [];

function createBridge(): legacy.CountervaluesBridge {
  return {
    rates: { fetchHistorical: jest.fn(), fetchLatest: jest.fn() },
    setPollingIsPolling: jest.fn(),
    setPollingTriggerLoad: jest.fn(),
    setState: jest.fn(),
    setStateError: jest.fn(),
    setStatePending: jest.fn(),
    useSupportedCryptoIds: () => supportedCryptoIds,
    usePollingIsPolling: () => false,
    usePollingTriggerLoad: () => false,
    useStateError: () => loadError,
    useStatePending: () => true,
    useState: () => state,
    useUserSettings: () => settings,
    wipe: jest.fn(),
  };
}

function wrapperFor(Provider: Provider, bridge: legacy.CountervaluesBridge) {
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return React.createElement(Provider, { bridge, children });
  };
}

describe.each([
  {
    hooks: "platform",
    provider: "-react",
    useHooks: platform,
    Provider: legacy.CountervaluesProvider,
  },
  {
    hooks: "-react",
    provider: "platform",
    useHooks: legacy,
    Provider: platform.CountervaluesProvider,
  },
] satisfies { hooks: string; provider: string; useHooks: Hooks; Provider: Provider }[])(
  "$hooks hooks under the $provider provider",
  ({ useHooks, Provider }) => {
    it("read the provider's bridge", () => {
      const { result } = renderHook(
        () => ({
          state: useHooks.useCountervaluesState(),
          polling: useHooks.useCountervaluesPolling(),
          userSettings: useHooks.useCountervaluesUserSettings(),
        }),
        { wrapper: wrapperFor(Provider, createBridge()) },
      );

      expect(result.current.state).toBe(state);
      expect(result.current.userSettings).toBe(settings);
      expect(result.current.polling).toMatchObject({ pending: true, error: loadError });
    });

    it("calculate from the provider's state", () => {
      const { result } = renderHook(
        () => ({
          calculated: useHooks.useCalculate({
            value: oneBitcoin.toNumber(),
            from: bitcoin,
            to: usd,
          }),
          calculateCallback: useHooks.useCalculateCountervalueCallback({ to: usd }),
          sendAmount: useHooks.useSendAmount({
            cryptoCurrency: bitcoin,
            fiatCurrency: usd,
            cryptoAmount: oneBitcoin,
          }),
        }),
        { wrapper: wrapperFor(Provider, createBridge()) },
      );
      const { calculated, calculateCallback, sendAmount } = result.current;

      expect(calculated).toBe(thirtyThousandDollars);
      expect(calculateCallback(bitcoin, oneBitcoin)?.toNumber()).toBeCloseTo(thirtyThousandDollars);
      expect(sendAmount.fiatAmount.toNumber()).toBeCloseTo(thirtyThousandDollars);
      expect(sendAmount.fiatUnit).toBe(usd.units[0]);
      expect(
        sendAmount.calculateCryptoAmount(new BigNumber(thirtyThousandDollars)).toNumber(),
      ).toBe(oneBitcoin.toNumber());
    });

    it("drive the provider's bridge through the polling controls", () => {
      const bridge = createBridge();
      const { result } = renderHook(() => useHooks.useCountervaluesPolling(), {
        wrapper: wrapperFor(Provider, bridge),
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
  },
);

// Control: without a provider the accessor throws, so the renders above pass only because each
// package's hooks found the other package's provider.
describe.each([
  { hooks: "platform", useHooks: platform },
  { hooks: "-react", useHooks: legacy },
] satisfies { hooks: string; useHooks: Hooks }[])(
  "$hooks hooks without a provider",
  ({ useHooks }) => {
    it("throw", () => {
      jest.spyOn(console, "error").mockImplementation(() => {});

      expect(() => renderHook(() => useHooks.useCountervaluesState())).toThrow(
        "'useCountervaluesBridgeContext' must be used within a 'CountervaluesProvider'",
      );
    });
  },
);
