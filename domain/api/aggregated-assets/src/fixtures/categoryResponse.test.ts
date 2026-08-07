import { buildCategoryResponse, metaCurrencyId } from "./categoryResponse.mock";

describe("metaCurrencyId", () => {
  it("applies the DADA meta-currency prefix", () => {
    expect(metaCurrencyId("usdt")).toBe("urn:crypto:meta-currency:usdt");
  });
});

describe("buildCategoryResponse", () => {
  it("returns every collection empty for no assets", () => {
    expect(buildCategoryResponse([])).toEqual({
      cryptoAssets: {},
      networks: {},
      cryptoOrTokenCurrencies: {},
      interestRates: {},
      markets: {},
      currenciesOrder: { key: "marketCap", order: "desc", metaCurrencyIds: [] },
    });
  });

  describe("a ticker-only asset, which is all the stablecoins list needs", () => {
    const response = buildCategoryResponse([{ ticker: "USDT" }]);

    it("derives the slug from the lower-cased ticker", () => {
      expect(response.cryptoAssets["urn:crypto:meta-currency:usdt"]).toEqual({
        id: "urn:crypto:meta-currency:usdt",
        ticker: "USDT",
        name: "USDT",
        assetsIds: {},
      });
    });

    it("adds no network, currency or market entry", () => {
      expect(response.networks).toEqual({});
      expect(response.cryptoOrTokenCurrencies).toEqual({});
      expect(response.markets).toEqual({});
    });

    it("lists the asset in currenciesOrder", () => {
      expect(response.currenciesOrder.metaCurrencyIds).toEqual(["urn:crypto:meta-currency:usdt"]);
    });
  });

  describe("a tokenised asset", () => {
    const response = buildCategoryResponse([
      {
        ticker: "AAPLX",
        slug: "applex",
        name: "Apple xStock",
        token: {
          network: "solana",
          tokenType: "spl",
          contractAddress: "XsAAPL",
        },
      },
    ]);

    it("points assetsIds at the token id", () => {
      expect(response.cryptoAssets["urn:crypto:meta-currency:applex"].assetsIds).toEqual({
        solana: "solana/spl/applex",
      });
    });

    it("builds the token currency under the same id", () => {
      expect(response.cryptoOrTokenCurrencies["solana/spl/applex"]).toEqual({
        type: "TokenCurrency",
        id: "solana/spl/applex",
        name: "Apple xStock",
        ticker: "AAPLX",
        contractAddress: "XsAAPL",
        parentCurrencyId: "solana",
        tokenType: "spl",
        units: [{ name: "AAPLX", code: "AAPLX", magnitude: 8 }],
      });
    });

    it("registers the network with a capitalised name", () => {
      expect(response.networks).toEqual({ solana: { id: "solana", name: "Solana" } });
    });
  });

  it("honours an explicit slug over the ticker", () => {
    const response = buildCategoryResponse([{ ticker: "TSLAX", slug: "teslax" }]);

    expect(Object.keys(response.cryptoAssets)).toEqual(["urn:crypto:meta-currency:teslax"]);
  });

  it("honours an explicit network name and magnitude", () => {
    const response = buildCategoryResponse([
      {
        ticker: "USDC",
        token: {
          network: "bsc",
          networkName: "Binance Smart Chain",
          tokenType: "bep20",
          contractAddress: "0x0",
          magnitude: 18,
        },
      },
    ]);

    expect(response.networks.bsc.name).toBe("Binance Smart Chain");
    expect(response.cryptoOrTokenCurrencies["bsc/bep20/usdc"]).toMatchObject({
      units: [{ name: "USDC", code: "USDC", magnitude: 18 }],
    });
  });

  it("keys markets by meta-currency id", () => {
    const response = buildCategoryResponse([
      { ticker: "AAPLX", slug: "applex", market: { price: 1 } },
    ]);

    expect(response.markets).toEqual({ "urn:crypto:meta-currency:applex": { price: 1 } });
  });

  it("deduplicates a shared network across assets", () => {
    const token = { network: "solana", tokenType: "spl", contractAddress: "0x0" };
    const response = buildCategoryResponse([
      { ticker: "AAPLX", token },
      { ticker: "TSLAX", token },
    ]);

    expect(Object.keys(response.networks)).toEqual(["solana"]);
    expect(Object.keys(response.cryptoOrTokenCurrencies)).toHaveLength(2);
  });

  it("preserves the given order in currenciesOrder", () => {
    const response = buildCategoryResponse([{ ticker: "B" }, { ticker: "A" }]);

    expect(response.currenciesOrder.metaCurrencyIds).toEqual([
      "urn:crypto:meta-currency:b",
      "urn:crypto:meta-currency:a",
    ]);
  });
});
