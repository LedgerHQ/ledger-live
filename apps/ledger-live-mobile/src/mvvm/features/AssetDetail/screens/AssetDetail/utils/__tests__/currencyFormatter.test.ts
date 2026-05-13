import { parseCurrencyString, getDecimalSeparator } from "../currencyFormatter";

describe("getDecimalSeparator", () => {
  it("returns '.' for en-US", () => {
    expect(getDecimalSeparator("en-US")).toBe(".");
  });

  it("returns ',' for fr-FR", () => {
    expect(getDecimalSeparator("fr-FR")).toBe(",");
  });
});

describe("parseCurrencyString", () => {
  it("parses a USD string (en-US) with currency before the number", () => {
    const result = parseCurrencyString("$1,234.56", "en-US");

    expect(result).toEqual({
      integerPart: "1234",
      decimalPart: "56",
      currencyText: "$",
      decimalSeparator: ".",
      currencyPosition: "start",
    });
  });

  it("parses a EUR string (fr-FR) with currency after the number", () => {
    const result = parseCurrencyString("1 234,56 €", "fr-FR");

    expect(result).toEqual({
      integerPart: "1234",
      decimalPart: "56",
      currencyText: "€",
      decimalSeparator: ",",
      currencyPosition: "end",
    });
  });

  it("handles a value with no decimal part", () => {
    const result = parseCurrencyString("$100", "en-US");

    expect(result.integerPart).toBe("100");
    expect(result.decimalPart).toBeUndefined();
  });

  it("returns fallback when no digits are found", () => {
    const result = parseCurrencyString("N/A", "en-US");

    expect(result).toEqual({
      integerPart: "0",
      decimalPart: "00",
      currencyText: "",
      decimalSeparator: ".",
      currencyPosition: "start",
    });
  });

  it("handles Intl.NumberFormat output for large values", () => {
    const formatted = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(76872);

    const result = parseCurrencyString(formatted, "en-US");

    expect(result.integerPart).toBe("76872");
    expect(result.decimalPart).toBe("00");
    expect(result.currencyText).toBe("$");
  });

  it("handles apostrophe group separator (de-CH)", () => {
    const formatted = new Intl.NumberFormat("de-CH", {
      style: "currency",
      currency: "CHF",
      numberingSystem: "latn",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(10000.2);

    const result = parseCurrencyString(formatted, "de-CH");

    expect(result.integerPart).toBe("10000");
    expect(result.decimalPart).toBe("20");
  });

  it("handles ar-SA with numberingSystem latn", () => {
    const formatted = new Intl.NumberFormat("ar-SA", {
      style: "currency",
      currency: "SAR",
      numberingSystem: "latn",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(1234.56);

    const result = parseCurrencyString(formatted, "ar-SA");

    expect(result.integerPart).toBe("1234");
    expect(result.decimalPart).toBe("56");
  });
});
