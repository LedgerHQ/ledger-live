import { buildAssetDistribution } from "../buildAssetDistribution";
import type { AssetsDataLike, BuildAssetDistributionOpts } from "../types";
import type { Account } from "@ledgerhq/types-live";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import BigNumber from "bignumber.js";
import type { CounterValuesState } from "@ledgerhq/live-countervalues/types";

const mockFindCryptoCurrencyById = jest.fn();

jest.mock("@ledgerhq/cryptoassets", () => ({
  findCryptoCurrencyById: (...args: unknown[]) => mockFindCryptoCurrencyById(...args),
  legacyIdToApiId: (id: string) => {
    if (id.startsWith("stellar/asset/")) return id.toLowerCase();
    if (id.startsWith("multiversx/esdt/")) return id.replace("multiversx/esdt/", "elrond/esdt/");
    return id;
  },
}));

jest.mock("@ledgerhq/live-countervalues/logic", () => ({
  calculate: jest.fn((_state, { value }: { value: number }) => value * 2),
}));

function makeCurrency(id: string, name = id, magnitude = 8): CryptoCurrency {
  return {
    type: "CryptoCurrency",
    id,
    name,
    ticker: id.toUpperCase(),
    units: [{ name: id, code: id.toUpperCase(), magnitude }],
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
  const ethOptimism = makeCurrency("optimism", "Optimism");
  const btcCurrency = makeCurrency("bitcoin", "Bitcoin");

  beforeEach(() => {
    jest.clearAllMocks();
    mockFindCryptoCurrencyById.mockImplementation((id: string) => {
      if (id === "ethereum") return ethMainnet;
      return undefined;
    });
  });

  const assetsData: AssetsDataLike = {
    cryptoAssets: {
      "urn:crypto:meta-currency:ethereum": {
        id: "urn:crypto:meta-currency:ethereum",
        assetsIds: {
          ethereum: "ethereum",
          arbitrum: "arbitrum",
          base: "base",
          optimism: "optimism",
        },
      },
      "urn:crypto:meta-currency:bitcoin": {
        id: "urn:crypto:meta-currency:bitcoin",
        assetsIds: { bitcoin: "bitcoin" },
      },
    },
    markets: {
      ethereum: { id: "ethereum" },
      bitcoin: { id: "bitcoin" },
      optimism: { id: "optimism" },
    },
  };

  const distribute = (
    accounts: Account[],
    opts?: BuildAssetDistributionOpts,
    data: AssetsDataLike = assetsData,
  ) => buildAssetDistribution(accounts, cvState, usd, data, opts);

  it("should group ETH across multiple networks into a single item", () => {
    const result = distribute([
      makeAccount("eth-1", ethMainnet, 1000),
      makeAccount("arb-1", ethArbitrum, 500),
      makeAccount("base-1", ethBase, 300),
    ]);

    expect(result.isAvailable).toBe(true);
    expect(result.list).toHaveLength(1);
    expect(result.list[0].metaCurrencyId).toBe("urn:crypto:meta-currency:ethereum");
    expect(result.list[0].currency.id).toBe("ethereum");
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
    expect(result.list[0].currency.id).toBe("ethereum");
    expect(result.list[0].marketId).toBe("ethereum");
  });

  it("should canonicalize Base and Optimism-only ETH groups to Ethereum", () => {
    const partialEthereumAssetsData: AssetsDataLike = {
      cryptoAssets: {
        ...assetsData.cryptoAssets,
        "urn:crypto:meta-currency:ethereum": {
          id: "urn:crypto:meta-currency:ethereum",
          assetsIds: { base: "base", optimism: "optimism" },
        },
      },
      markets: {
        base: { id: "base" },
        optimism: { id: "optimism" },
      },
    };

    const result = distribute(
      [makeAccount("base-1", ethBase, 300), makeAccount("op-1", ethOptimism, 200)],
      undefined,
      partialEthereumAssetsData,
    );

    expect(result.list).toHaveLength(1);
    expect(result.list[0].metaCurrencyId).toBe("urn:crypto:meta-currency:ethereum");
    expect(result.list[0].currency.id).toBe("ethereum");
    expect(result.list[0].marketId).toBe("ethereum");
    expect(result.list[0].networks?.map(network => network.currency.id)).toEqual([
      "base",
      "optimism",
    ]);
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

  it("should normalize cross-network amounts when tokens have different magnitudes", () => {
    const ethUsdt = makeCurrency("ethereum/erc20/usd_tether__erc20_", "Tether USD", 6);
    const bscUsdt = makeCurrency("bsc/bep20/binance-peg_bsc-usd", "Tether USD", 18);

    mockFindCryptoCurrencyById.mockImplementation((id: string) => {
      if (id === "tether") return ethUsdt;
      return undefined;
    });

    const tetherAssetsData: AssetsDataLike = {
      cryptoAssets: {
        "urn:crypto:meta-currency:tether": {
          id: "urn:crypto:meta-currency:tether",
          assetsIds: {
            ethereum: "ethereum/erc20/usd_tether__erc20_",
            bsc: "bsc/bep20/binance-peg_bsc-usd",
          },
        },
      },
      markets: {},
    };

    const result = distribute(
      [
        makeAccount("eth-usdt-1", ethUsdt, 1_000_000),
        makeAccount("bsc-usdt-1", bscUsdt, 1_000_000_000_000_000),
      ],
      undefined,
      tetherAssetsData,
    );

    expect(result.list).toHaveLength(1);
    expect(result.list[0].metaCurrencyId).toBe("urn:crypto:meta-currency:tether");
    expect(result.list[0].amount).toBe(1_001_000);
  });

  describe("DADA id format normalization (LIVE-22557 / LIVE-22558)", () => {
    const ethereumUsdc = makeCurrency("ethereum/erc20/usd__coin", "USD Coin");
    const stellarUsdcMixedCase = makeCurrency(
      "stellar/asset/USDC:GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN",
      "USDC",
    );
    const multiversxUsdc = makeCurrency("multiversx/esdt/USDC-c76f1f", "USD Coin");

    const usdCoinAssetsData: AssetsDataLike = {
      cryptoAssets: {
        "urn:crypto:meta-currency:usd_coin": {
          id: "urn:crypto:meta-currency:usd_coin",
          assetsIds: {
            ethereum: "ethereum/erc20/usd__coin",
            stellar: "stellar/asset/usdc:ga5zsejyb37jrc5avcia5mop4rhtm335x2kgx3ihojapp5re34k4kzvn",
            elrond: "elrond/esdt/USDC-c76f1f",
          },
        },
      },
      markets: {},
    };

    it("should aggregate mixed-case Stellar USDC under usd_coin meta-currency", () => {
      const result = distribute(
        [
          makeAccount("eth-usdc-1", ethereumUsdc, 1000),
          makeAccount("xlm-usdc-1", stellarUsdcMixedCase, 200),
        ],
        undefined,
        usdCoinAssetsData,
      );

      expect(result.list).toHaveLength(1);
      expect(result.list[0].metaCurrencyId).toBe("urn:crypto:meta-currency:usd_coin");
      expect(result.list[0].networks).toHaveLength(2);
      const networkIds = result.list[0].networks!.map(n => n.currency.id).sort();
      expect(networkIds).toEqual(
        [
          "ethereum/erc20/usd__coin",
          "stellar/asset/USDC:GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN",
        ].sort(),
      );
    });

    it("should aggregate MultiversX USDC under usd_coin meta-currency (multiversx -> elrond)", () => {
      const result = distribute(
        [
          makeAccount("eth-usdc-1", ethereumUsdc, 1000),
          makeAccount("egld-usdc-1", multiversxUsdc, 500),
        ],
        undefined,
        usdCoinAssetsData,
      );

      expect(result.list).toHaveLength(1);
      expect(result.list[0].metaCurrencyId).toBe("urn:crypto:meta-currency:usd_coin");
      expect(result.list[0].networks).toHaveLength(2);
      const networkIds = result.list[0].networks!.map(n => n.currency.id).sort();
      expect(networkIds).toEqual(
        ["ethereum/erc20/usd__coin", "multiversx/esdt/USDC-c76f1f"].sort(),
      );
    });
  });
});
