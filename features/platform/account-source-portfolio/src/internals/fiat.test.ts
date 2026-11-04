import { BigNumber } from "bignumber.js";
import { CountervalueTickerSchema } from "@domain/entity-account-balance";
import { countervaluesOf, fiatOf } from "./fiat";

const USD = CountervalueTickerSchema.parse("USD");

describe("fiatOf", () => {
  it("reads a known fiat with its smallest unit's magnitude", () => {
    expect(fiatOf({ countervalue: USD })).toEqual({ ticker: "USD", currency: "USD", magnitude: 2 });
    expect(fiatOf({ countervalue: CountervalueTickerSchema.parse("JPY") })).toEqual({
      ticker: "JPY",
      currency: "JPY",
      magnitude: 0,
    });
  });

  it("keeps a fiat ticker a crypto shares, as Mantle does the tögrög's MNT", () => {
    expect(fiatOf({ countervalue: CountervalueTickerSchema.parse("MNT") })).toMatchObject({
      ticker: "MNT",
      currency: "MNT",
    });
  });

  it("names a crypto countervalue by its CAL id, as the service takes it", () => {
    expect(fiatOf({ countervalue: CountervalueTickerSchema.parse("BTC") })).toEqual({
      ticker: "BTC",
      currency: "bitcoin",
      magnitude: 8,
    });
  });

  it("reads no fiat when none or an unknown one is asked", () => {
    expect(fiatOf(undefined)).toBeUndefined();
    expect(fiatOf({ countervalue: CountervalueTickerSchema.parse("XYZ") })).toBeUndefined();
  });
});

describe("countervaluesOf", () => {
  const usd = fiatOf({ countervalue: USD });

  it("reads a value in the fiat's main unit into its smallest unit, half up", () => {
    expect(countervaluesOf(12.345, usd)).toEqual({ countervalues: { USD: "1235" } });
    expect(countervaluesOf(new BigNumber("0.004"), usd)).toEqual({ countervalues: { USD: "0" } });
  });

  it("reads none without a fiat or a value", () => {
    expect(countervaluesOf(1, undefined)).toBeUndefined();
    expect(countervaluesOf(null, usd)).toBeUndefined();
    expect(countervaluesOf(undefined, usd)).toBeUndefined();
  });
});
