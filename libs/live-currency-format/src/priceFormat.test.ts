import { BigNumber } from "bignumber.js";
import type { Unit } from "@ledgerhq/types-cryptoassets";
import {
  formatPrice,
  formatPriceFragment,
  formatSignedFiatVariation,
  roundFiatPrice,
} from "./priceFormat";

// Matches what `getFiatCurrencyByTicker("USD").units[0]` returns (see @ledgerhq/cryptoassets/src/fiats.ts).
const usdUnit: Unit = {
  code: "$",
  name: "US Dollar",
  magnitude: 2,
  showAllDigits: true,
  prefixCode: true,
};

// Convert a fiat amount (e.g. $50,000) into the unit's smallest atom (5,000,000).
const atoms = (fiat: number): BigNumber => new BigNumber(fiat).shiftedBy(usdUnit.magnitude);

describe("formatPrice", () => {
  describe("for whole-unit prices (>= 1 fiat unit)", () => {
    it("formats a large price with thousands separators", () => {
      expect(formatPrice(usdUnit, atoms(77_738))).toBe("77,738.00");
    });

    it("treats a price of exactly 1 as a whole-unit price", () => {
      expect(formatPrice(usdUnit, atoms(1))).toBe("1.00");
    });

    it("renders zero as a clean '0.00'", () => {
      expect(formatPrice(usdUnit, atoms(0))).toBe("0.00");
    });

    it("preserves the negative sign", () => {
      expect(formatPrice(usdUnit, atoms(-1_234.56))).toBe("-1,234.56");
    });

    it("truncates anything beyond the 2nd decimal (does not round half-up)", () => {
      expect(formatPrice(usdUnit, atoms(3_243.567))).toBe("3,243.56");
    });
  });

  describe("for sub-unit prices (< 1 fiat unit)", () => {
    it("formats a cents-range price down to the 4th decimal", () => {
      expect(formatPrice(usdUnit, atoms(0.0923))).toBe("0.0923");
    });

    it("formats a sub-cent price down to the 6th decimal", () => {
      expect(formatPrice(usdUnit, atoms(0.000006))).toBe("0.000006");
    });

    it("preserves the negative sign on a sub-cent price", () => {
      expect(formatPrice(usdUnit, atoms(-0.000006))).toBe("-0.000006");
    });

    it("truncates anything beyond the 6th decimal", () => {
      expect(formatPrice(usdUnit, atoms(0.12345678))).toBe("0.123456");
    });
  });

  describe("options", () => {
    it("prefixes the locale currency symbol when showCode is enabled", () => {
      expect(formatPrice(usdUnit, atoms(100), { showCode: true })).toBe("$100.00");
    });

    it("omits the currency symbol by default", () => {
      expect(formatPrice(usdUnit, atoms(100), { showCode: false })).toBe("100.00");
    });

    it("masks the value when discreet mode is enabled", () => {
      expect(formatPrice(usdUnit, atoms(50_000), { discreet: true })).toBe("***");
    });
  });
});

describe("formatPriceFragment", () => {
  it("splits a price into integer, decimal and currency parts (no leading separator on the decimal)", () => {
    const fragment = formatPriceFragment(usdUnit, 77_738.92, "en-US");
    expect(fragment.integerPart).toBe("77,738");
    expect(fragment.decimalPart).toBe("92");
    expect(fragment.currencyText).toBe("$");
  });

  it("splits a sub-cent price the same way, with the digits in the decimal part", () => {
    const fragment = formatPriceFragment(usdUnit, 0.000006, "en-US");
    expect(fragment.integerPart).toBe("0");
    expect(fragment.decimalPart).toBe("000006");
    expect(fragment.currencyText).toBe("$");
  });

  it("caps the decimal part at 6 digits, even for prices smaller than that", () => {
    const fragment = formatPriceFragment(usdUnit, 0.0000012345, "en-US");
    expect((fragment.decimalPart ?? "").length).toBeLessThanOrEqual(6);
  });
});

describe("formatSignedFiatVariation", () => {
  describe("when the variation is at least 1 cent", () => {
    it("prepends a '+' for a positive variation", () => {
      expect(formatSignedFiatVariation(1.2, usdUnit, "en-US")).toBe("+$1.20");
    });

    it("prepends a '-' for a negative variation", () => {
      expect(formatSignedFiatVariation(-3.46, usdUnit, "en-US")).toBe("-$3.46");
    });

    it("omits the sign when the variation is exactly zero", () => {
      expect(formatSignedFiatVariation(0, usdUnit, "en-US")).toBe("$0.00");
    });
  });

  describe("when the variation is sub-cent", () => {
    it("signs a small positive variation", () => {
      expect(formatSignedFiatVariation(0.004, usdUnit, "en-US")).toBe("+$0.004");
    });

    it("truncates a negative variation beyond the 6th decimal", () => {
      expect(formatSignedFiatVariation(-0.00001234, usdUnit, "en-US")).toBe("-$0.000012");
    });
  });

  describe("when the variation is smaller than the formatter can represent", () => {
    it("emits a signed '<' threshold marker for a tiny negative variation", () => {
      expect(formatSignedFiatVariation(-6e-9, usdUnit, "en-US")).toBe("-<$0.000001");
    });

    it("emits a signed '<' threshold marker for a tiny positive variation", () => {
      expect(formatSignedFiatVariation(5e-8, usdUnit, "en-US")).toBe("+<$0.000001");
    });
  });
});

describe("roundFiatPrice", () => {
  describe("for whole-unit prices (>= 1 fiat unit)", () => {
    it("leaves an already-rounded value untouched", () => {
      expect(roundFiatPrice(50_000)).toBe(50_000);
    });

    it("rounds half-up at the 2nd decimal", () => {
      expect(roundFiatPrice(50_000.567)).toBe(50_000.57);
    });

    it("treats a price of exactly 1 as a whole-unit price", () => {
      expect(roundFiatPrice(1)).toBe(1);
    });
  });

  describe("for sub-unit prices (< 1 fiat unit)", () => {
    it("leaves a 6-digit value untouched", () => {
      expect(roundFiatPrice(0.001234)).toBe(0.001234);
    });

    it("rounds half-up at the 6th decimal", () => {
      expect(roundFiatPrice(0.1234567)).toBe(0.123457);
    });

    it("leaves a mid-range value untouched", () => {
      expect(roundFiatPrice(0.5)).toBe(0.5);
    });
  });

  describe("when the amount is smaller than 6 fractional digits can represent", () => {
    it("collapses a value below the 6th decimal to zero", () => {
      expect(roundFiatPrice(0.0000001234)).toBe(0);
    });

    it("collapses an extremely small value to zero", () => {
      expect(roundFiatPrice(6e-9)).toBe(0);
    });
  });

  describe("for negative amounts", () => {
    it("applies the whole-unit rule based on the absolute value", () => {
      expect(roundFiatPrice(-50_000.567)).toBe(-50_000.57);
    });

    it("preserves the negative sign on a sub-unit price", () => {
      expect(roundFiatPrice(-0.001234)).toBe(-0.001234);
    });
  });
});
