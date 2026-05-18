import type { Quote } from "../types";
import { sortQuotes } from "./sortQuotes";

function makeQuote(key: string, overrides: Partial<Quote["quoteDetails"]> = {}): Quote {
  return {
    key,
    provider: "lifi",
    providerDetails: {
      name: "LiFi",
      type: "DEX",
      isUniswapX: false,
      requiresKYC: false,
      continuesInProviderLiveApp: false,
    },
    quoteDetails: {
      type: "float",
      sendAmount: 1,
      receiveAmount: 1,
      gasLess: false,
      networkFees: { currencyId: "ethereum" },
      slippage: 1,
      exchangeRate: 1,
      ...overrides,
    },
    warnings: [],
    errors: [],
  };
}

describe("sortQuotes", () => {
  it("orders quotes by net countervalue descending", () => {
    const quotes = [
      makeQuote("low", { receiveAmount: 1 }),
      makeQuote("high", { receiveAmount: 3 }),
      makeQuote("middle", { receiveAmount: 2 }),
    ];

    const sorted = sortQuotes(quotes, {
      receiveCurrencyId: "bitcoin",
      spotPrices: { bitcoin: 30_000 },
      feeCurrencyMagnitude: 18,
    });

    expect(sorted.map(q => q.key)).toEqual(["high", "middle", "low"]);
  });

  it("subtracts estimated and approval network fee countervalues", () => {
    const higherReceiveWithFees = makeQuote("higher-receive-with-fees", {
      receiveAmount: 1,
      estimatedNetworkFee: { amount: "100000000000000000", currencyId: "ethereum" },
      approvalNetworkFee: { amount: "100000000000000000", currencyId: "ethereum" },
    });
    const lowerReceiveNoFees = makeQuote("lower-receive-no-fees", {
      receiveAmount: 0.99,
    });

    const sorted = sortQuotes([higherReceiveWithFees, lowerReceiveNoFees], {
      receiveCurrencyId: "bitcoin",
      spotPrices: { bitcoin: 30_000, ethereum: 2_000 },
      feeCurrencyMagnitude: 18,
    });

    expect(sorted.map(q => q.key)).toEqual(["lower-receive-no-fees", "higher-receive-with-fees"]);
  });

  it("preserves input order for equal net countervalues", () => {
    const quotes = [
      makeQuote("first", { receiveAmount: 1 }),
      makeQuote("second", { receiveAmount: 1 }),
      makeQuote("third", { receiveAmount: 1 }),
    ];

    const sorted = sortQuotes(quotes, {
      receiveCurrencyId: "bitcoin",
      spotPrices: { bitcoin: 30_000 },
      feeCurrencyMagnitude: 18,
    });

    expect(sorted.map(q => q.key)).toEqual(["first", "second", "third"]);
  });

  it("uses current live-app spot price fallbacks", () => {
    const feePriced = makeQuote("fee-priced", {
      receiveAmount: 10,
      estimatedNetworkFee: { amount: "1000000000000000000", currencyId: "ethereum" },
    });
    const feeUnpriced = makeQuote("fee-unpriced", {
      receiveAmount: 9,
      estimatedNetworkFee: { amount: "1000000000000000000", currencyId: "ethereum" },
    });

    const sorted = sortQuotes([feePriced, feeUnpriced], {
      receiveCurrencyId: "bitcoin",
      spotPrices: {},
      feeCurrencyMagnitude: 18,
    });

    expect(sorted.map(q => q.key)).toEqual(["fee-priced", "fee-unpriced"]);
  });
});
