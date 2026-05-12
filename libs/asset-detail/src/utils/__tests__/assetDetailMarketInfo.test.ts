import type { MarketCurrencyData } from "@ledgerhq/live-common/market/utils/types";
import { isMarketCurrencyData, resolveAssetDetailMarketInfo } from "../assetDetailMarketInfo";

const baseMarket = (overrides: Partial<MarketCurrencyData> = {}): MarketCurrencyData =>
  ({
    id: "bitcoin",
    ledgerIds: ["bitcoin"],
    name: "Bitcoin",
    ticker: "BTC",
    price: 1,
    ...overrides,
  }) as MarketCurrencyData;

describe("resolveAssetDetailMarketInfo", () => {
  it("returns the first defined source converted to AssetDetailMarketInfo", () => {
    const result = resolveAssetDetailMarketInfo(undefined, baseMarket({ name: "First" }));
    expect(result?.name).toBe("First");
  });

  it("falls back to ledgerIds[0] when the source has no id", () => {
    const result = resolveAssetDetailMarketInfo(
      baseMarket({ id: undefined, ledgerIds: ["solana"] }),
    );
    expect(result?.id).toBe("solana");
  });

  it("returns undefined when every source is undefined or empty", () => {
    expect(resolveAssetDetailMarketInfo(undefined, undefined)).toBeUndefined();
  });

  it("skips a source that has neither id, name, ticker, price nor ledgerIds", () => {
    const empty = { ledgerIds: [] } as unknown as MarketCurrencyData;
    expect(resolveAssetDetailMarketInfo(empty, baseMarket({ name: "Fallback" }))).toMatchObject({
      name: "Fallback",
    });
  });
});

describe("isMarketCurrencyData", () => {
  it("returns true when the shape has id + ledgerIds array", () => {
    expect(isMarketCurrencyData({ id: "x", ledgerIds: [] })).toBe(true);
  });

  it("returns false for null, primitives or arrays", () => {
    expect(isMarketCurrencyData(null)).toBe(false);
    expect(isMarketCurrencyData("bitcoin")).toBe(false);
    expect(isMarketCurrencyData([])).toBe(false);
  });

  it("returns false when ledgerIds is not an array", () => {
    expect(isMarketCurrencyData({ id: "x", ledgerIds: "nope" })).toBe(false);
  });
});
