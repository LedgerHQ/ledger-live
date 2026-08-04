import { emptyAssetsData } from "./emptyAssetsData";

describe("emptyAssetsData", () => {
  it("returns every collection, all empty", () => {
    expect(emptyAssetsData()).toEqual({
      cryptoAssets: {},
      networks: {},
      cryptoOrTokenCurrencies: {},
      interestRates: {},
      markets: {},
      currenciesOrder: { metaCurrencyIds: [], key: "", order: "" },
    });
  });

  /*
   * Load-bearing: the chunked lookup endpoint uses this as a reduce seed and then mutates the
   * accumulator in place. A shared instance would leak merged assets between queries.
   */
  it("returns a fresh object on every call", () => {
    const first = emptyAssetsData();
    const second = emptyAssetsData();

    expect(first).not.toBe(second);
    expect(first.cryptoAssets).not.toBe(second.cryptoAssets);
    expect(first.currenciesOrder).not.toBe(second.currenciesOrder);
    expect(first.currenciesOrder.metaCurrencyIds).not.toBe(second.currenciesOrder.metaCurrencyIds);
  });

  it("is not affected by mutating a previous result", () => {
    const first = emptyAssetsData();
    first.cryptoAssets.btc = { id: "btc", ticker: "BTC", name: "Bitcoin", assetsIds: {} };
    first.currenciesOrder.metaCurrencyIds.push("btc");

    expect(emptyAssetsData().cryptoAssets).toEqual({});
    expect(emptyAssetsData().currenciesOrder.metaCurrencyIds).toEqual([]);
  });
});
