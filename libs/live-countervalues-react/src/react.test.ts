import React from "react";
import {
  CountervaluesProvider,
  useTrackingPairForAccounts,
  type CountervaluesBridge,
} from ".";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { renderHook, act, render, waitFor } from "@testing-library/react";
import {
  inferTrackingPairForAccounts,
  initialState,
  loadCountervalues,
} from "@ledgerhq/live-countervalues/logic";
import type {
  CountervaluesSettings,
  CounterValuesState,
  TrackingPair,
} from "@ledgerhq/live-countervalues/types";
import type { Currency, FiatCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";

jest.mock("@ledgerhq/live-countervalues/logic", () => ({
  ...jest.requireActual("@ledgerhq/live-countervalues/logic"),
  loadCountervalues: jest.fn(),
}));

const usd: FiatCurrency = {
  type: "FiatCurrency",
  name: "US Dollar",
  ticker: "USD",
  symbol: "$",
  units: [{ name: "dollar", code: "USD", magnitude: 2, showAllDigits: true, prefixCode: true }],
};
const eur: FiatCurrency = {
  type: "FiatCurrency",
  name: "Euro",
  ticker: "EUR",
  symbol: "€",
  units: [{ name: "euro", code: "EUR", magnitude: 2, showAllDigits: true, prefixCode: true }],
};

describe("useTrackingPairForAccounts", () => {
  const accounts = Array(20)
    .fill(null)
    .map((_, i) => genAccount("test" + i));
  const trackingPairs = inferTrackingPairForAccounts(accounts, usd);

  test("it returns same tracking pairs as when using inferTrackingPairForAccounts", async () => {
    const { result } = renderHook(() => useTrackingPairForAccounts(accounts, usd));
    await act(async () => {
      expect(result.current).toEqual(trackingPairs);
    });
  });

  test("a re-render preserve the reference", async () => {
    const { result, rerender } = renderHook(() => useTrackingPairForAccounts(accounts, usd));
    let initial: TrackingPair[] | undefined;
    await act(async () => {
      initial = result.current;
    });
    rerender();
    await act(async () => {
      expect(result.current).toBe(initial);
    });
  });

  test("a re-render preserve the reference even when accounts change", async () => {
    const { result, rerender } = renderHook(() =>
      useTrackingPairForAccounts(accounts.slice(0), usd),
    );
    let initial: TrackingPair[] | undefined;
    await act(async () => {
      initial = result.current;
    });
    rerender();
    await act(async () => {
      expect(result.current).toBe(initial);
    });
  });

  test("when accounts appears, it properly converge to the trackingPairs", async () => {
    const { result, rerender } = renderHook(added =>
      useTrackingPairForAccounts(!added ? [] : accounts, usd),
    );
    await act(async () => {
      expect(result.current).toEqual([]);
    });
    rerender(true);
    await act(async () => {
      expect(result.current).toEqual(trackingPairs);
    });
  });

  test("when accounts changes fundamentally, pairs change", async () => {
    const { result, rerender } = renderHook(empty =>
      useTrackingPairForAccounts(empty ? [] : accounts, usd),
    );
    await act(async () => {
      expect(result.current).toEqual(trackingPairs);
    });
    rerender(true);
    await act(async () => {
      expect(result.current).toEqual([]);
    });
  });

  test("when currency changes, pairs change", async () => {
    const { result, rerender } = renderHook(usesEur =>
      useTrackingPairForAccounts(accounts, usesEur ? eur : usd),
    );
    await act(async () => {
      expect(result.current).toEqual(trackingPairs);
    });
    rerender(true);
    await act(async () => {
      expect(result.current).not.toEqual(trackingPairs);
    });
  });

  test("if accounts reorder, it doesn't change", async () => {
    const reverse = accounts.slice(0).reverse();
    const { result, rerender } = renderHook(rev =>
      useTrackingPairForAccounts(rev ? reverse : accounts, usd),
    );
    let initial: TrackingPair[] | undefined;
    await act(async () => {
      initial = result.current;
    });
    rerender(true);
    await act(async () => {
      expect(result.current).toBe(initial);
    });
  });

  test("if accounts doubles, it doesn't change", async () => {
    const doubled = accounts.concat(accounts);
    const { result, rerender } = renderHook(d =>
      useTrackingPairForAccounts(d ? doubled : accounts, usd),
    );
    let initial: TrackingPair[] | undefined;
    await act(async () => {
      initial = result.current;
    });
    rerender(true);
    await act(async () => {
      expect(result.current).toBe(initial);
    });
  });
});

describe("CountervaluesProvider", () => {
  const bitcoin = genAccount("bitcoin").currency;
  const unsupportedToken: TokenCurrency = {
    type: "TokenCurrency",
    id: "ethereum/erc20/lc_staked_shared_eth_0xc4dcb059dd98b45b090da8982234c61d0b9e84f9",
    contractAddress: "0xc4dcb059dd98b45b090da8982234c61d0b9e84f9",
    parentCurrencyId: "ethereum",
    tokenType: "erc20",
    name: "Ledger Staked Shared ETH",
    ticker: "osETH",
    delisted: false,
    disableCountervalue: false,
    units: [{ name: "osETH", code: "osETH", magnitude: 18 }],
  };
  const supportedPair = trackingPair(bitcoin);
  const unsupportedPair = trackingPair(unsupportedToken);
  const mockLoadCountervalues = jest.mocked(loadCountervalues);

  beforeEach(() => {
    jest.clearAllMocks();
    mockLoadCountervalues.mockResolvedValue(initialState);
  });

  it("should filter unsupported tracking pairs before polling when marketcap ids are loaded", async () => {
    const bridge = createBridge({
      marketcapIds: [bitcoin.id],
      trackingPairs: [supportedPair, unsupportedPair],
    });

    render(React.createElement(CountervaluesProvider, { bridge, children: null }));

    await waitFor(() => expect(mockLoadCountervalues).toHaveBeenCalledTimes(1));
    expect(mockLoadCountervalues.mock.calls[0][1].trackingPairs).toEqual([supportedPair]);
  });

  it("should keep tracking pairs unchanged before marketcap ids are loaded", async () => {
    const trackingPairs = [supportedPair, unsupportedPair];
    const bridge = createBridge({ marketcapIds: [], trackingPairs });

    render(React.createElement(CountervaluesProvider, { bridge, children: null }));

    await waitFor(() => expect(mockLoadCountervalues).toHaveBeenCalledTimes(1));
    expect(mockLoadCountervalues.mock.calls[0][1].trackingPairs).toBe(trackingPairs);
  });
});

function trackingPair(from: Currency): TrackingPair {
  return { from, to: usd, startDate: new Date("2026-06-19T00:00:00.000Z") };
}

function createBridge({
  marketcapIds,
  trackingPairs,
}: {
  marketcapIds: string[];
  trackingPairs: TrackingPair[];
}): CountervaluesBridge {
  const settings: CountervaluesSettings = {
    trackingPairs,
    autofillGaps: true,
    refreshRate: 60_000,
    marketCapBatchingAfterRank: 20,
  };
  const state: CounterValuesState = initialState;

  return {
    setPollingIsPolling: jest.fn(),
    setPollingTriggerLoad: jest.fn(),
    setState: jest.fn(),
    setStateError: jest.fn(),
    setStatePending: jest.fn(),
    useMarketcapIds: () => marketcapIds,
    usePollingIsPolling: () => false,
    usePollingTriggerLoad: () => true,
    useStateError: () => null,
    useStatePending: () => false,
    useState: () => state,
    useUserSettings: () => settings,
    wipe: jest.fn(),
  };
}
