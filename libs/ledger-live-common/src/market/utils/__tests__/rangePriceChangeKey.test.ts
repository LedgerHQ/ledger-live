import { KeysPriceChange } from "../types";
import { getPriceChangeKeyForRange, BASE_RANGE_TO_PRICE_CHANGE_KEY } from "../rangePriceChangeKey";

describe("BASE_RANGE_TO_PRICE_CHANGE_KEY", () => {
  it("maps standard chart ranges to market API keys", () => {
    expect(BASE_RANGE_TO_PRICE_CHANGE_KEY).toEqual({
      "1d": KeysPriceChange.day,
      "1w": KeysPriceChange.week,
      "1m": KeysPriceChange.month,
      "1y": KeysPriceChange.year,
    });
  });
});

describe("getPriceChangeKeyForRange", () => {
  it("returns the base mapping for standard ranges", () => {
    expect(getPriceChangeKeyForRange("1d")).toBe(KeysPriceChange.day);
    expect(getPriceChangeKeyForRange("1w")).toBe(KeysPriceChange.week);
    expect(getPriceChangeKeyForRange("1m")).toBe(KeysPriceChange.month);
    expect(getPriceChangeKeyForRange("1y")).toBe(KeysPriceChange.year);
  });

  it("returns undefined for ranges without a market key", () => {
    expect(getPriceChangeKeyForRange("all")).toBeUndefined();
  });

  it("prefers platform extensions over the base mapping", () => {
    expect(getPriceChangeKeyForRange("6m", { "6m": KeysPriceChange.sixMonths })).toBe(
      KeysPriceChange.sixMonths,
    );
    expect(getPriceChangeKeyForRange("5y", { "5y": KeysPriceChange.year })).toBe(
      KeysPriceChange.year,
    );
  });
});
