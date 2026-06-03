import { parseCurrencyUnitFragment } from "../parseCurrencyUnitFragment";

describe("parseCurrencyUnitFragment", () => {
  it("maps start currency to prefixSymbol", () => {
    expect(
      parseCurrencyUnitFragment({
        integerPart: "1,234",
        decimalPart: "56",
        decimalSeparator: ".",
        currencyText: "$",
        currencyPosition: "start",
      }),
    ).toEqual({
      prefixSymbol: "$",
      suffixSymbol: null,
      hasDecimals: true,
      integerPart: "1,234",
      decimalSeparator: ".",
      decimalPart: "56",
    });
  });

  it("maps end currency to suffixSymbol", () => {
    expect(
      parseCurrencyUnitFragment({
        integerPart: "42",
        decimalPart: "",
        decimalSeparator: ".",
        currencyText: "USD",
        currencyPosition: "end",
      }),
    ).toEqual({
      prefixSymbol: null,
      suffixSymbol: "USD",
      hasDecimals: false,
      integerPart: "42",
      decimalSeparator: ".",
      decimalPart: "",
    });
  });
});
