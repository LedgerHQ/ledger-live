import BigNumber from "bignumber.js";

import { EMPTY_FORMATTED_NUMBER, toFormattedNumber } from "./toFormattedNumber";

const NBSP = "\u00A0";

describe("toFormattedNumber", () => {
  it("produces a triplet where withPrefix / withSuffix fall back to numberValue when no prefix / suffix is supplied", () => {
    const out = toFormattedNumber(1234.5, { locale: "en" });
    expect(out).toEqual({
      numberValue: "1,234.5",
      withPrefix: "1,234.5",
      withSuffix: "1,234.5",
    });
  });

  it("glues the prefix verbatim and separates the suffix with a non-breaking space by default", () => {
    const out = toFormattedNumber(4500, {
      locale: "en",
      prefix: "$",
      suffix: "ETH",
    });
    expect(out).toEqual({
      numberValue: "4,500",
      withPrefix: "$4,500",
      withSuffix: `4,500${NBSP}ETH`,
    });
  });

  it("honors prefixSeparator so word-like prefixes (e.g. tickers) keep a non-breaking space", () => {
    const out = toFormattedNumber(4500, {
      locale: "en",
      prefix: "USDC",
      prefixSeparator: NBSP,
      suffix: "USDC",
    });
    expect(out).toEqual({
      numberValue: "4,500",
      withPrefix: `USDC${NBSP}4,500`,
      withSuffix: `4,500${NBSP}USDC`,
    });
  });

  it("honors an empty suffixSeparator so percent-like suffixes sit flush", () => {
    const out = toFormattedNumber(0.5, {
      locale: "en",
      suffix: "%",
      suffixSeparator: "",
    });
    expect(out.withSuffix).toBe("0.5%");
    expect(out.withSuffix).not.toContain(NBSP);
  });

  it("caps decimals via numberOfDecimals", () => {
    const out = toFormattedNumber("1.0123456789", {
      locale: "en",
      numberOfDecimals: 4,
      suffix: "ETH",
    });
    expect(out.numberValue).toBe("1.0123");
    expect(out.withSuffix).toBe(`1.0123${NBSP}ETH`);
  });

  it("preserves large numeric strings beyond JavaScript safe integer precision", () => {
    const out = toFormattedNumber("9007199254740993", { locale: "en" });

    expect(out.numberValue).toBe("9,007,199,254,740,993");
  });

  it("caps decimals when numberOfDecimals is zero", () => {
    const out = toFormattedNumber("1234.56", {
      locale: "en",
      numberOfDecimals: 0,
    });

    expect(out.numberValue).toBe("1,235");
  });

  it("collapses to EMPTY_FORMATTED_NUMBER for nullish / NaN / non-finite values", () => {
    expect(toFormattedNumber(undefined, { locale: "en" })).toEqual(EMPTY_FORMATTED_NUMBER);
    expect(toFormattedNumber(null, { locale: "en" })).toEqual(EMPTY_FORMATTED_NUMBER);
    expect(toFormattedNumber("not-a-number", { locale: "en", suffix: "ETH" })).toEqual(
      EMPTY_FORMATTED_NUMBER,
    );
    expect(toFormattedNumber(new BigNumber(NaN), { locale: "en" })).toEqual(EMPTY_FORMATTED_NUMBER);
    expect(toFormattedNumber(Infinity, { locale: "en" })).toEqual(EMPTY_FORMATTED_NUMBER);
  });

  it("respects the BCP 47 locale for separators", () => {
    const out = toFormattedNumber(1234.5, { locale: "fr", suffix: "EUR" });
    // French locale: comma as decimal separator, non-ASCII whitespace
    // between thousands. Exact whitespace codepoint (`\u00A0` vs `\u202F`)
    // depends on the ICU build shipped with the runtime, so assert the
    // semantic shape instead of the exact character.
    expect(out.numberValue).toMatch(/^1\s234,5$/u);
    // Ticker suffix keeps using our explicit `\u00A0` separator.
    expect(out.withSuffix.endsWith(`${NBSP}EUR`)).toBe(true);
  });
});
