import { cryptocurrenciesById } from "@ledgerhq/cryptoassets/currencies";
import { formatCurrencyUnit } from "./formatCurrencyUnit";
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
});
