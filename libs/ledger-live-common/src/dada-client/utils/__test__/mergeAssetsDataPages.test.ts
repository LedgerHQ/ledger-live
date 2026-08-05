import { mergeAssetsDataPages } from "../mergeAssetsDataPages";
import type { AssetsDataWithPagination } from "../../state-manager/types";

const makePage = (overrides: Partial<AssetsDataWithPagination> = {}): AssetsDataWithPagination => ({
  cryptoAssets: {},
  networks: {},
  cryptoOrTokenCurrencies: {},
  interestRates: {},
  markets: {},
  currenciesOrder: { metaCurrencyIds: [], key: "", order: "" },
  pagination: { nextCursor: "" },
  ...overrides,
});

describe("mergeAssetsDataPages", () => {
  it("returns undefined for undefined input", () => {
    expect(mergeAssetsDataPages(undefined)).toBeUndefined();
  });

  it("returns an empty shape for an empty page list", () => {
    expect(mergeAssetsDataPages([])).toEqual(makePage());
  });

  it("returns the single page's content unchanged", () => {
    const page = makePage({
      cryptoAssets: { btc: { id: "btc", ticker: "BTC", name: "Bitcoin", assetsIds: {} } },
      currenciesOrder: { metaCurrencyIds: ["btc"], key: "marketCap", order: "desc" },
      pagination: { nextCursor: "cursor-2" },
    });

    expect(mergeAssetsDataPages([page])).toEqual(page);
  });

  describe("collections are shallow-merged across pages", () => {
    it("combines disjoint keys from every collection", () => {
      const merged = mergeAssetsDataPages([
        makePage({
          cryptoAssets: { btc: { id: "btc", ticker: "BTC", name: "Bitcoin", assetsIds: {} } },
          networks: { bitcoin: { id: "bitcoin", name: "Bitcoin" } },
          interestRates: {
            btc: { currencyId: "btc", rate: 1, type: "APY", fetchAt: "2026-01-01" },
          },
          markets: { btc: { price: 1 } },
        }),
        makePage({
          cryptoAssets: { eth: { id: "eth", ticker: "ETH", name: "Ether", assetsIds: {} } },
          networks: { ethereum: { id: "ethereum", name: "Ethereum" } },
          interestRates: {
            eth: { currencyId: "eth", rate: 2, type: "APR", fetchAt: "2026-01-01" },
          },
          markets: { eth: { price: 2 } },
        }),
      ]);

      expect(Object.keys(merged!.cryptoAssets)).toEqual(["btc", "eth"]);
      expect(Object.keys(merged!.networks)).toEqual(["bitcoin", "ethereum"]);
      expect(Object.keys(merged!.interestRates)).toEqual(["btc", "eth"]);
      expect(Object.keys(merged!.markets)).toEqual(["btc", "eth"]);
    });

    it("lets a later page overwrite an earlier key wholesale", () => {
      const merged = mergeAssetsDataPages([
        makePage({ markets: { btc: { price: 1, priceChangePercentage24h: 5 } } }),
        makePage({ markets: { btc: { price: 2 } } }),
      ]);

      // Object.assign replaces the whole entry rather than deep-merging it
      expect(merged!.markets.btc).toEqual({ price: 2 });
    });

    it("does not deep-merge nested assetsIds, unlike deepMergeCryptoAssets", () => {
      const merged = mergeAssetsDataPages([
        makePage({
          cryptoAssets: {
            eth: { id: "eth", ticker: "ETH", name: "Ether", assetsIds: { ethereum: "ethereum" } },
          },
        }),
        makePage({
          cryptoAssets: {
            eth: { id: "eth", ticker: "ETH", name: "Ether", assetsIds: { arbitrum: "arbitrum" } },
          },
        }),
      ]);

      expect(merged!.cryptoAssets.eth.assetsIds).toEqual({ arbitrum: "arbitrum" });
    });
  });

  describe("currenciesOrder", () => {
    it("concatenates metaCurrencyIds in page order", () => {
      const merged = mergeAssetsDataPages([
        makePage({ currenciesOrder: { metaCurrencyIds: ["btc", "eth"], key: "k", order: "desc" } }),
        makePage({ currenciesOrder: { metaCurrencyIds: ["sol"], key: "k", order: "desc" } }),
      ]);

      expect(merged!.currenciesOrder.metaCurrencyIds).toEqual(["btc", "eth", "sol"]);
    });

    it("keeps duplicate ids rather than deduplicating them", () => {
      const merged = mergeAssetsDataPages([
        makePage({ currenciesOrder: { metaCurrencyIds: ["btc"], key: "k", order: "desc" } }),
        makePage({ currenciesOrder: { metaCurrencyIds: ["btc"], key: "k", order: "desc" } }),
      ]);

      expect(merged!.currenciesOrder.metaCurrencyIds).toEqual(["btc", "btc"]);
    });

    it("takes key and order from the last page", () => {
      const merged = mergeAssetsDataPages([
        makePage({ currenciesOrder: { metaCurrencyIds: [], key: "marketCap", order: "desc" } }),
        makePage({ currenciesOrder: { metaCurrencyIds: [], key: "name", order: "asc" } }),
      ]);

      expect(merged!.currenciesOrder.key).toBe("name");
      expect(merged!.currenciesOrder.order).toBe("asc");
    });
  });

  describe("pagination", () => {
    it("takes nextCursor from the last page", () => {
      const merged = mergeAssetsDataPages([
        makePage({ pagination: { nextCursor: "cursor-2" } }),
        makePage({ pagination: { nextCursor: "cursor-3" } }),
      ]);

      expect(merged!.pagination.nextCursor).toBe("cursor-3");
    });

    it("reports no next cursor once the last page has none", () => {
      const merged = mergeAssetsDataPages([
        makePage({ pagination: { nextCursor: "cursor-2" } }),
        makePage({ pagination: { nextCursor: undefined } }),
      ]);

      expect(merged!.pagination.nextCursor).toBeUndefined();
    });
  });

  it("does not mutate the input pages", () => {
    const first = makePage({
      cryptoAssets: { btc: { id: "btc", ticker: "BTC", name: "Bitcoin", assetsIds: {} } },
      currenciesOrder: { metaCurrencyIds: ["btc"], key: "k", order: "desc" },
    });
    const second = makePage({
      cryptoAssets: { eth: { id: "eth", ticker: "ETH", name: "Ether", assetsIds: {} } },
      currenciesOrder: { metaCurrencyIds: ["eth"], key: "k", order: "desc" },
    });

    mergeAssetsDataPages([first, second]);

    expect(Object.keys(first.cryptoAssets)).toEqual(["btc"]);
    expect(first.currenciesOrder.metaCurrencyIds).toEqual(["btc"]);
    expect(Object.keys(second.cryptoAssets)).toEqual(["eth"]);
  });

  it("builds a fresh accumulator on every call", () => {
    const page = makePage({
      currenciesOrder: { metaCurrencyIds: ["btc"], key: "k", order: "desc" },
    });

    const first = mergeAssetsDataPages([page]);
    const second = mergeAssetsDataPages([page]);

    expect(first!.currenciesOrder.metaCurrencyIds).toEqual(["btc"]);
    expect(second!.currenciesOrder.metaCurrencyIds).toEqual(["btc"]);
    expect(first).not.toBe(second);
  });
});
