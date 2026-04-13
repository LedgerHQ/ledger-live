import { buildAssetDistribution } from "../buildAssetDistribution";
import type { AssetsDataLike, BuildAssetDistributionOpts } from "../types";
import type { Account } from "@ledgerhq/types-live";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import BigNumber from "bignumber.js";
import type { CounterValuesState } from "@ledgerhq/live-countervalues/types";

jest.mock("@ledgerhq/live-countervalues/logic", () => ({
  calculate: jest.fn((_state, { value }: { value: number }) => value * 2),
}));

function makeCurrency(id: string, name = id): CryptoCurrency {
  return {
    type: "CryptoCurrency",
    id,
    name,
    ticker: id.toUpperCase(),
    units: [{ name: id, code: id.toUpperCase(), magnitude: 8 }],
  } as unknown as CryptoCurrency;
}

function makeAccount(id: string, currency: CryptoCurrency, balance: number): Account {
  return {
    type: "Account",
    id,
    currency,
    balance: new BigNumber(balance),
    subAccounts: [],
  } as unknown as Account;
}

const cvState = {} as CounterValuesState;
const usd = { type: "FiatCurrency", id: "usd", ticker: "USD" } as any;

describe("buildAssetDistribution", () => {
  const ethMainnet = makeCurrency("ethereum", "Ethereum");
  const ethArbitrum = makeCurrency("arbitrum", "Arbitrum");
  const ethBase = makeCurrency("base", "Base");
  const btcCurrency = makeCurrency("bitcoin", "Bitcoin");

  const assetsData: AssetsDataLike = {
    cryptoAssets: {
      "urn:crypto:meta-currency:ethereum": {
        id: "urn:crypto:meta-currency:ethereum",
        assetsIds: { ethereum: "ethereum", arbitrum: "arbitrum", base: "base" },
      },
      "urn:crypto:meta-currency:bitcoin": {
        id: "urn:crypto:meta-currency:bitcoin",
        assetsIds: { bitcoin: "bitcoin" },
      },
    },
    markets: {
      ethereum: { id: "ethereum" },
      bitcoin: { id: "bitcoin" },
    },
  };

  const distribute = (accounts: Account[], opts?: BuildAssetDistributionOpts) =>
    buildAssetDistribution(accounts, cvState, usd, assetsData, opts);

  it("should group ETH across multiple networks into a single item", () => {
    const result = distribute([
      makeAccount("eth-1", ethMainnet, 1000),
      makeAccount("arb-1", ethArbitrum, 500),
      makeAccount("base-1", ethBase, 300),
    ]);

    expect(result.isAvailable).toBe(true);
    expect(result.list).toHaveLength(1);
    expect(result.list[0].metaCurrencyId).toBe("urn:crypto:meta-currency:ethereum");
    expect(result.list[0].amount).toBe(1800);
    expect(result.list[0].accounts).toHaveLength(3);
  });

  it("should populate networks[] with per-network breakdown", () => {
    const result = distribute([
      makeAccount("eth-1", ethMainnet, 1000),
      makeAccount("arb-1", ethArbitrum, 500),
    ]);

    expect(result.list[0].networks).toHaveLength(2);
    const ethNetwork = result.list[0].networks!.find(n => n.currency.id === "ethereum");
    const arbNetwork = result.list[0].networks!.find(n => n.currency.id === "arbitrum");
    expect(ethNetwork?.amount).toBe(1000);
    expect(arbNetwork?.amount).toBe(500);
  });

  it("should resolve marketId and slug from metaCurrencyId", () => {
    const result = distribute([makeAccount("eth-1", ethMainnet, 1000)]);

    expect(result.list[0].marketId).toBe("ethereum");
    expect(result.list[0].slug).toBe("ethereum");
  });

  it("should resolve marketId via primary asset when only secondary network accounts exist", () => {
    const result = distribute([makeAccount("arb-1", ethArbitrum, 500)]);

    expect(result.list[0].metaCurrencyId).toBe("urn:crypto:meta-currency:ethereum");
    expect(result.list[0].marketId).toBe("ethereum");
  });

  it("should build bySlug lookup", () => {
    const result = distribute([
      makeAccount("eth-1", ethMainnet, 1000),
      makeAccount("btc-1", btcCurrency, 2000),
    ]);

    expect(result.bySlug!["ethereum"]).toBe(result.list.find(i => i.slug === "ethereum"));
    expect(result.bySlug!["bitcoin"]).toBe(result.list.find(i => i.slug === "bitcoin"));
  });

  it("should fallback to currency.id when no DADA mapping exists", () => {
    const solana = makeCurrency("solana", "Solana");
    const result = distribute([makeAccount("sol-1", solana, 500)]);

    expect(result.list).toHaveLength(1);
    expect(result.list[0].metaCurrencyId).toBe("solana");
    expect(result.list[0].slug).toBe("solana");
  });

  it("should return not available for empty accounts", () => {
    const result = distribute([]);

    expect(result.isAvailable).toBe(false);
    expect(result.list).toHaveLength(0);
  });

  it("should sort by countervalue descending", () => {
    const result = distribute([
      makeAccount("eth-1", ethMainnet, 500),
      makeAccount("btc-1", btcCurrency, 2000),
    ]);

    expect(result.list[0].currency.id).toBe("bitcoin");
    expect(result.list[1].metaCurrencyId).toBe("urn:crypto:meta-currency:ethereum");
  });

  it("should compute distribution ratios summing to 1", () => {
    const result = distribute([
      makeAccount("eth-1", ethMainnet, 1000),
      makeAccount("btc-1", btcCurrency, 3000),
    ]);

    const total = result.list.reduce((sum, item) => sum + item.distribution, 0);
    expect(total).toBeCloseTo(1, 10);
  });

  it("should skip zero-balance accounts when showEmptyAccounts is false", () => {
    const result = distribute(
      [makeAccount("eth-1", ethMainnet, 0), makeAccount("btc-1", btcCurrency, 1000)],
      { showEmptyAccounts: false },
    );

    expect(result.list).toHaveLength(1);
    expect(result.list[0].currency.id).toBe("bitcoin");
  });

  it("should include zero-balance accounts when showEmptyAccounts is true", () => {
    const result = distribute(
      [makeAccount("eth-1", ethMainnet, 0), makeAccount("btc-1", btcCurrency, 1000)],
      { showEmptyAccounts: true },
    );

    expect(result.list).toHaveLength(2);
  });
});
