import BigNumber from "bignumber.js";
import { FiatCurrencyTickerSchema } from "@domain/entity-currency-fiat";
import { countervaluesOf, fiatOf } from "./fiat";

const USD = FiatCurrencyTickerSchema.parse("USD");

describe("fiatOf", () => {
  it("reads a known fiat with its smallest unit's magnitude", () => {
    expect(fiatOf({ countervalue: USD })).toEqual({ ticker: "USD", currency: "USD", magnitude: 2 });
    expect(fiatOf({ countervalue: FiatCurrencyTickerSchema.parse("JPY") })).toEqual({
      ticker: "JPY",
      currency: "JPY",
      magnitude: 0,
    });
  });

  it("keeps a fiat ticker a crypto shares, as Mantle does the tögrög's MNT", () => {
    expect(fiatOf({ countervalue: FiatCurrencyTickerSchema.parse("MNT") })).toMatchObject({
      ticker: "MNT",
      currency: "MNT",
    });
  });

  it("names a crypto countervalue by its CAL id, as the service takes it", () => {
    expect(fiatOf({ countervalue: FiatCurrencyTickerSchema.parse("BTC") })).toEqual({
      ticker: "BTC",
      currency: "bitcoin",
      magnitude: 8,
    });
  });

  it("names XBT, the other Bitcoin ticker, by the same CAL id", () => {
    expect(fiatOf({ countervalue: FiatCurrencyTickerSchema.parse("XBT") })).toEqual({
      ticker: "XBT",
      currency: "bitcoin",
      magnitude: 2,
    });
  });

  it("reads no fiat when none or an unknown one is asked", () => {
    expect(fiatOf(undefined)).toBeUndefined();
    expect(fiatOf({ countervalue: FiatCurrencyTickerSchema.parse("XYZ") })).toBeUndefined();
  });
});

describe("countervaluesOf", () => {
  const usd = fiatOf({ countervalue: USD });

  it("reads a worth in the fiat's main unit into its smallest unit, half up", () => {
    expect(countervaluesOf(new BigNumber(12.345), usd)).toEqual({ countervalues: { USD: "1235" } });
    expect(countervaluesOf(new BigNumber("-0.004"), usd)).toEqual({ countervalues: { USD: "0" } });
  });

  it("reads none without a fiat or a worth", () => {
    expect(countervaluesOf(new BigNumber(1), undefined)).toBeUndefined();
    expect(countervaluesOf(null, usd)).toBeUndefined();
  });
});
