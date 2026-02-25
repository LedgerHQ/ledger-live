import { cryptocurrenciesById } from "@ledgerhq/cryptoassets/currencies";
import { formatCurrencyUnit, formatCurrencyUnitFragment } from "./formatCurrencyUnit";
import { BigNumber } from "bignumber.js";
import { Unit } from "@ledgerhq/types-cryptoassets";

const testCases: { name: string; unit: Unit }[] = Object.values(cryptocurrenciesById).map(
  currency => {
    return {
      name: currency.name,
      unit: currency.units[0],
    };
  },
);

const localeTestCases = [
  "en-US",
  "fr-FR",
  "es-ES",
  "de-DE",
  "ja-JP",
  "ko-KR",
  "pt-BR",
  "ru-RU",
  "tr-TR",
  "zh-CN",
];

describe("formatCurrencyUnit", () => {
  describe("with default options", () => {
    test.each(testCases)("should correctly format $name unit ($unit.name)", ({ unit }) => {
      const value = new BigNumber("12345678900000000");
      expect(formatCurrencyUnit(unit, value)).toMatchSnapshot();
    });
  });

  describe("with custom options", () => {
    describe.each(localeTestCases)("with locale %s", locale => {
      test.each(testCases)("should correctly format $name unit ($unit.name)", ({ unit }) => {
        const value = new BigNumber("12345678900000000");
        const options = {
          joinFragmentsSeparator: "-",
          showCode: true,
          showAllDigits: true,
          locale,
        };
        expect(formatCurrencyUnit(unit, value, options)).toMatchSnapshot();
      });
    });
  });

  describe("error handling", () => {
    const unit: Unit = {
      name: "Test",
      code: "TST",
      magnitude: 2,
      showAllDigits: false,
      prefixCode: false,
    };

    test("handles non-BigNumber", () => {
      const consoleSpy = jest.spyOn(console, "warn").mockImplementation();
      expect(formatCurrencyUnit(unit, null as unknown as BigNumber)).toBe("");
      consoleSpy.mockRestore();
    });

    test("handles NaN", () => {
      const consoleSpy = jest.spyOn(console, "warn").mockImplementation();
      expect(formatCurrencyUnit(unit, new BigNumber(NaN))).toBe("");
      consoleSpy.mockRestore();
    });

    test("handles Infinity", () => {
      const consoleSpy = jest.spyOn(console, "warn").mockImplementation();
      expect(formatCurrencyUnit(unit, new BigNumber(Infinity))).toBe("");
      consoleSpy.mockRestore();
    });
  });

  describe("formatCurrencyUnit options", () => {
    const unit: Unit = {
      name: "Test",
      code: "USD",
      magnitude: 2,
      showAllDigits: false,
      prefixCode: false,
    };

    test("prefixCode true", () => {
      const prefixUnit: Unit = { ...unit, prefixCode: true };
      expect(formatCurrencyUnit(prefixUnit, new BigNumber("12345"), { showCode: true })).toBe(
        "USD123.45",
      );
    });

    test("prefixCode false", () => {
      expect(formatCurrencyUnit(unit, new BigNumber("12345"), { showCode: true })).toBe(
        "123.45\u00A0USD",
      );
    });

    test("negative with prefixCode", () => {
      const prefixUnit: Unit = { ...unit, prefixCode: true };
      expect(formatCurrencyUnit(prefixUnit, new BigNumber("-12345"), { showCode: true })).toBe(
        "-USD123.45",
      );
    });

    test("negative with suffixCode", () => {
      expect(formatCurrencyUnit(unit, new BigNumber("-12345"), { showCode: true })).toBe(
        "-123.45\u00A0USD",
      );
    });

    test("alwaysShowSign", () => {
      expect(formatCurrencyUnit(unit, new BigNumber("12345"), { alwaysShowSign: true })).toBe(
        "+123.45",
      );
    });

    test("discreet mode", () => {
      expect(formatCurrencyUnit(unit, new BigNumber("12345"), { discreet: true })).toBe("***");
    });

    test("joinFragmentsSeparator", () => {
      const prefixUnit: Unit = { ...unit, prefixCode: true };
      expect(
        formatCurrencyUnit(prefixUnit, new BigNumber("12345"), {
          showCode: true,
          joinFragmentsSeparator: "-",
        }),
      ).toBe("USD-123.45");
    });

    test("useGrouping false", () => {
      expect(
        formatCurrencyUnit(unit, new BigNumber("12345678"), { useGrouping: false }),
      ).not.toContain(",");
    });

    test("showAllDigits", () => {
      const highMagUnit: Unit = { ...unit, magnitude: 4 };
      expect(formatCurrencyUnit(highMagUnit, new BigNumber("12345"), { showAllDigits: true })).toBe(
        "1.2345",
      );
    });

    test("filters undefined options", () => {
      expect(
        formatCurrencyUnit(unit, new BigNumber("12345"), { showCode: undefined, locale: "en-US" }),
      ).toBe("123.45");
    });
  });

  describe("formatCurrencyUnitFragment", () => {
    const unit: Unit = {
      name: "Test",
      code: "USD",
      magnitude: 2,
      showAllDigits: false,
      prefixCode: false,
    };

    test("basic structure", () => {
      const result = formatCurrencyUnitFragment(unit, new BigNumber("12345"));
      expect(result.integerPart).toBe("123");
      expect(result.decimalPart).toBe("45");
      expect(result.decimalSeparator).toBe(".");
      expect(result.currencyText).toBe("");
      expect(result.currencyPosition).toBe("end");
    });

    test("negative with prefixCode false", () => {
      const result = formatCurrencyUnitFragment(unit, new BigNumber("-12345"), { showCode: true });
      expect(result.integerPart).toBe("-123");
      expect(result.currencyText).toBe("USD");
    });

    test("negative with prefixCode true", () => {
      const prefixUnit: Unit = { ...unit, prefixCode: true };
      const result = formatCurrencyUnitFragment(prefixUnit, new BigNumber("-12345"), {
        showCode: true,
      });
      expect(result.integerPart).toBe("123");
      expect(result.currencyText).toBe("-USD");
    });

    test("negative with prefixCode true but no code", () => {
      const prefixUnit: Unit = { ...unit, prefixCode: true };
      const result = formatCurrencyUnitFragment(prefixUnit, new BigNumber("-12345"), {
        showCode: false,
      });
      expect(result.integerPart).toBe("-123");
      expect(result.currencyText).toBe("");
    });

    test("alwaysShowSign", () => {
      const result = formatCurrencyUnitFragment(unit, new BigNumber("12345"), {
        alwaysShowSign: true,
      });
      expect(result.integerPart).toBe("+123");
    });

    test("no decimals", () => {
      const result = formatCurrencyUnitFragment(unit, new BigNumber("10000"));
      expect(result.integerPart).toBe("100");
      expect(result.decimalPart).toBe("");
    });

    test("french locale", () => {
      const result = formatCurrencyUnitFragment(unit, new BigNumber("12345"), { locale: "fr-FR" });
      expect(result.decimalSeparator).toBe(",");
    });

    test("error handling", () => {
      const consoleSpy = jest.spyOn(console, "warn").mockImplementation();
      const result = formatCurrencyUnitFragment(unit, null as unknown as BigNumber);
      expect(result.integerPart).toBe("");
      expect(result.decimalPart).toBe("");
      consoleSpy.mockRestore();
    });

    test("error handling with prefixCode true", () => {
      const prefixUnit: Unit = { ...unit, prefixCode: true };
      const consoleSpy = jest.spyOn(console, "warn").mockImplementation();
      const result = formatCurrencyUnitFragment(prefixUnit, new BigNumber(NaN));
      expect(result.currencyPosition).toBe("start");
      consoleSpy.mockRestore();
    });
  });

  describe("coverage edge cases", () => {
    test("disableRounding with subMagnitude", () => {
      const unit: Unit = {
        name: "Test",
        code: "TST",
        magnitude: 2,
        showAllDigits: false,
        prefixCode: false,
      };
      const value = new BigNumber("12345");
      const result = formatCurrencyUnit(unit, value, { disableRounding: true, subMagnitude: 1 });
      expect(result).toContain("123.45");
    });

    test("prefixCode true without code", () => {
      const unit: Unit = {
        name: "Test",
        code: "USD",
        magnitude: 2,
        showAllDigits: false,
        prefixCode: true,
      };
      const value = new BigNumber("12345");
      const result = formatCurrencyUnit(unit, value, { showCode: false });
      expect(result).toBe("123.45");
    });
  });
});
