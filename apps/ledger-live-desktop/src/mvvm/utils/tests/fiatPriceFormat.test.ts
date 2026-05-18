import { BigNumber } from "bignumber.js";
import type { Unit } from "@ledgerhq/types-cryptoassets";
import {
  fiatFloatToSmallestUnit,
  formatFiatPrice,
  formatFiatPriceFragment,
  getFiatPriceFormatOptions,
} from "../fiatPriceFormat";

const usdUnit: Unit = {
  name: "US Dollar",
  code: "USD",
  magnitude: 2,
  showAllDigits: false,
  prefixCode: false,
};

const jpyUnit: Unit = {
  name: "Japanese Yen",
  code: "JPY",
  magnitude: 0,
  showAllDigits: false,
  prefixCode: false,
};

describe("getFiatPriceFormatOptions", () => {
  it("caps total fractional digits at 8 for sub-base-unit values (USD, magnitude 2)", () => {
    expect(getFiatPriceFormatOptions(usdUnit, new BigNumber(99.99))).toEqual({
      subMagnitude: 6,
      disableRounding: true,
    });
    expect(getFiatPriceFormatOptions(usdUnit, new BigNumber(0.000591))).toEqual({
      subMagnitude: 6,
      disableRounding: true,
    });
  });

  it("returns no extra precision when value >= 10^magnitude", () => {
    expect(getFiatPriceFormatOptions(usdUnit, new BigNumber(100))).toEqual({
      subMagnitude: 0,
      disableRounding: false,
    });
    expect(getFiatPriceFormatOptions(usdUnit, new BigNumber(5_000_000))).toEqual({
      subMagnitude: 0,
      disableRounding: false,
    });
  });

  it("treats negative sub-base-unit values the same as positive ones", () => {
    expect(getFiatPriceFormatOptions(usdUnit, new BigNumber(-0.000591))).toEqual({
      subMagnitude: 6,
      disableRounding: true,
    });
    expect(getFiatPriceFormatOptions(usdUnit, new BigNumber(-100))).toEqual({
      subMagnitude: 0,
      disableRounding: false,
    });
  });

  it("uses the full 8-digit budget for magnitude 0 units (e.g. JPY)", () => {
    expect(getFiatPriceFormatOptions(jpyUnit, new BigNumber(0.5))).toEqual({
      subMagnitude: 8,
      disableRounding: true,
    });
    expect(getFiatPriceFormatOptions(jpyUnit, new BigNumber(1))).toEqual({
      subMagnitude: 0,
      disableRounding: false,
    });
  });
});

describe("fiatFloatToSmallestUnit", () => {
  it("scales by 10^magnitude for USD", () => {
    expect(fiatFloatToSmallestUnit(usdUnit, 0.00000591).toString()).toBe("0.000591");
    expect(fiatFloatToSmallestUnit(usdUnit, 0.07).toString()).toBe("7");
    expect(fiatFloatToSmallestUnit(usdUnit, 50000).toString()).toBe("5000000");
  });

  it("is a no-op for magnitude 0 units", () => {
    expect(fiatFloatToSmallestUnit(jpyUnit, 12345).toString()).toBe("12345");
  });

  it("accepts string and BigNumber inputs", () => {
    expect(fiatFloatToSmallestUnit(usdUnit, "0.5").toString()).toBe("50");
    expect(fiatFloatToSmallestUnit(usdUnit, new BigNumber("0.5")).toString()).toBe("50");
  });
});

describe("formatFiatPrice", () => {
  it("renders micro-cap prices without truncation", () => {
    expect(formatFiatPrice(usdUnit, new BigNumber(0.000591), { showCode: true })).toBe(
      "0.00000591\u00A0USD",
    );
  });

  it("strips trailing zeros for sub-cent prices", () => {
    expect(formatFiatPrice(usdUnit, new BigNumber(7), { showCode: true })).toBe("0.07\u00A0USD");
  });

  it("renders standard prices with grouping and no extra digits", () => {
    expect(formatFiatPrice(usdUnit, new BigNumber(5_000_000), { showCode: true })).toBe(
      "50,000\u00A0USD",
    );
  });

  it("forwards locale option", () => {
    expect(
      formatFiatPrice(usdUnit, new BigNumber(0.000591), { showCode: true, locale: "fr-FR" }),
    ).toBe("0,00000591\u00A0USD");
  });
});

describe("formatFiatPriceFragment", () => {
  it("splits micro-cap prices into integer/decimal parts", () => {
    const result = formatFiatPriceFragment(usdUnit, new BigNumber(0.000591), { showCode: true });
    expect(result).toEqual({
      integerPart: "0",
      decimalPart: "00000591",
      decimalSeparator: ".",
      currencyText: "USD",
      currencyPosition: "end",
    });
  });

  it("omits the decimal part for round whole-unit prices", () => {
    const result = formatFiatPriceFragment(usdUnit, new BigNumber(5_000_000), { showCode: true });
    expect(result.integerPart).toBe("50,000");
    expect(result.decimalPart).toBe("");
    expect(result.currencyText).toBe("USD");
  });
});
