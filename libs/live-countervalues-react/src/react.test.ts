import React from "react";
import { CountervaluesProvider, type CountervaluesBridge } from ".";
import { genAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import { render, waitFor } from "@testing-library/react";
import { initialState, loadCountervalues } from "@ledgerhq/live-countervalues/logic";
import type {
  CountervaluesSettings,
  CounterValuesState,
  TrackingPair,
} from "@ledgerhq/live-countervalues/types";
import type {
  Currency,
  FiatCurrency,
  TokenCurrency,
} from "@ledgerhq/ledger-wallet-framework/types";
import {
  CryptoCurrencyIdSchema,
  TokenCurrencyIdSchema,
} from "@ledgerhq/ledger-wallet-framework/types";

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

describe("CountervaluesProvider", () => {
  const bitcoin = genAccount("bitcoin").currency;
  const unsupportedToken: TokenCurrency = {
    type: "TokenCurrency",
    id: TokenCurrencyIdSchema.parse(
      "ethereum/erc20/lc_staked_shared_eth_0xc4dcb059dd98b45b090da8982234c61d0b9e84f9",
    ),
    contractAddress: "0xc4dcb059dd98b45b090da8982234c61d0b9e84f9",
    parentCurrencyId: CryptoCurrencyIdSchema.parse("ethereum"),
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

  it("should filter unsupported tracking pairs before polling when supported crypto ids are loaded", async () => {
    const bridge = createBridge({
      supportedCryptoIds: [bitcoin.id],
      trackingPairs: [supportedPair, unsupportedPair],
    });

    render(React.createElement(CountervaluesProvider, { bridge, children: null }));

    await waitFor(() => expect(mockLoadCountervalues).toHaveBeenCalledTimes(1));
    expect(mockLoadCountervalues.mock.calls[0][1].trackingPairs).toEqual([supportedPair]);
  });

  it("should keep tracking pairs unchanged before supported crypto ids are loaded", async () => {
    const trackingPairs = [supportedPair, unsupportedPair];
    const bridge = createBridge({ supportedCryptoIds: [], trackingPairs });

    render(React.createElement(CountervaluesProvider, { bridge, children: null }));

    await waitFor(() => expect(mockLoadCountervalues).toHaveBeenCalledTimes(1));
    expect(mockLoadCountervalues.mock.calls[0][1].trackingPairs).toBe(trackingPairs);
  });

  it("should use the same API-ID lookup in filter and batching for remapped currencies", async () => {
    // assethub_polkadot maps to "polkadot" via inferCurrencyAPIID.
    // supportedCryptoIds contains API IDs, so the correct key is "polkadot", not "assethub_polkadot".
    const assethubPolkadot: Currency = {
      ...bitcoin,
      id: CryptoCurrencyIdSchema.parse("assethub_polkadot"),
      name: "Asset Hub Polkadot",
      ticker: "DOT",
    };
    const bridge = createBridge({
      supportedCryptoIds: ["polkadot"],
      trackingPairs: [trackingPair(assethubPolkadot)],
    });

    render(React.createElement(CountervaluesProvider, { bridge, children: null }));

    await waitFor(() => expect(mockLoadCountervalues).toHaveBeenCalledTimes(1));
    // filterSupportedTrackingPairs resolves assethub_polkadot → polkadot, so the pair is kept
    expect(mockLoadCountervalues.mock.calls[0][1].trackingPairs).toHaveLength(1);
    // shouldBatchCurrencyFrom must also resolve to "polkadot" (rank 0, ≤ marketCapBatchingAfterRank 20) → not batched
    expect(mockLoadCountervalues.mock.calls[0][2]?.shouldBatchCurrencyFrom(assethubPolkadot)).toBe(
      false,
    );
  });
});

function trackingPair(from: Currency): TrackingPair {
  return { from, to: usd, startDate: new Date("2026-06-19T00:00:00.000Z") };
}

function createBridge({
  supportedCryptoIds,
  trackingPairs,
}: {
  supportedCryptoIds: string[];
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
    useSupportedCryptoIds: () => supportedCryptoIds,
    usePollingIsPolling: () => false,
    usePollingTriggerLoad: () => true,
    useStateError: () => null,
    useStatePending: () => false,
    useState: () => state,
    useUserSettings: () => settings,
    wipe: jest.fn(),
  };
}
