import { countervalueCryptoCurrencies, findCountervalueCryptoCurrencyByTicker } from "./support";

describe("countervalueCryptoCurrencies", () => {
  it("exposes exactly bitcoin and ethereum, resolved by id", () => {
    expect(countervalueCryptoCurrencies.map(c => c.id)).toEqual(["bitcoin", "ethereum"]);
  });
});

describe("findCountervalueCryptoCurrencyByTicker", () => {
  it("resolves BTC to bitcoin and ETH to ethereum, case-insensitively", () => {
    expect(findCountervalueCryptoCurrencyByTicker("BTC")?.id).toBe("bitcoin");
    expect(findCountervalueCryptoCurrencyByTicker("btc")?.id).toBe("bitcoin");
    expect(findCountervalueCryptoCurrencyByTicker("ETH")?.id).toBe("ethereum");
    expect(findCountervalueCryptoCurrencyByTicker("eth")?.id).toBe("ethereum");
  });

  it("returns undefined for a ticker registered to another currency (CRO)", () => {
    expect(findCountervalueCryptoCurrencyByTicker("CRO")).toBeUndefined();
  });

  it("returns undefined for an unknown ticker", () => {
    expect(findCountervalueCryptoCurrencyByTicker("NOT_A_CURRENCY")).toBeUndefined();
  });

  it("returns undefined for a fiat ticker", () => {
    expect(findCountervalueCryptoCurrencyByTicker("USD")).toBeUndefined();
  });

  it("returns undefined instead of throwing for undefined, null, or an empty ticker", () => {
    expect(findCountervalueCryptoCurrencyByTicker(undefined)).toBeUndefined();
    expect(findCountervalueCryptoCurrencyByTicker(null)).toBeUndefined();
    expect(findCountervalueCryptoCurrencyByTicker("")).toBeUndefined();
  });
});
