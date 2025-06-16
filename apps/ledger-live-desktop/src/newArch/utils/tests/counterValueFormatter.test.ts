import { counterValueFormatter } from "../counterValueFormatter";
import { TFunction } from "i18next";

const translations = {
  "numberCompactNotation.K": "K",
  "numberCompactNotation.M": "M",
  "numberCompactNotation.B": "B",
};

const mockT = jest.fn().mockImplementation((key: keyof typeof translations) => {
  return translations[key] || key;
}) as unknown as TFunction;

describe("counterValueFormatter", () => {
  it("should return '-' for NaN values", () => {
    const result = counterValueFormatter({
      value: NaN,
      locale: "en-US",
    });
    expect(result).toBe("-");
  });

  it("should format a number as currency", () => {
    const result = counterValueFormatter({
      value: 1234.56,
      currency: "USD",
      locale: "en-US",
    });
    expect(result).toBe("$1,234.56");
  });

  it("should format a number as decimal when no currency is provided", () => {
    const result = counterValueFormatter({
      value: 1234.56,
      locale: "en-US",
    });
    expect(result).toBe("1,234.56");
  });

  it("should format a number in compact notation when shorten is true", () => {
    const result = counterValueFormatter({
      value: 1234567,
      locale: "en-US",
      shorten: true,
    });
    expect(result).toContain("1.235M");
  });

  it("should include the ticker in the formatted value", () => {
    const result = counterValueFormatter({
      value: 1234.56,
      locale: "en-US",
      ticker: "BTC",
    });
    expect(result).toBe("1,234.56 BTC");
  });

  it("should allow zero values when allowZeroValue is true", () => {
    const result = counterValueFormatter({
      value: 0,
      locale: "en-US",
      allowZeroValue: true,
    });
    expect(result).toBe("0");
  });

  it("should format a number in compact notation with translation", () => {
    const result = counterValueFormatter({
      value: 1234567,
      locale: "en-US",
      shorten: true,
      t: mockT,
    });

    expect(result).toContain("1.235 M");
    expect(mockT).toHaveBeenCalledWith("numberCompactNotation.M");
  });

  it("should handle different locales for formatting", () => {
    const result = counterValueFormatter({
      value: 1234.56,
      locale: "fr-FR",
    });
    expect(result).toBe("1\u202f234,56");
  });

  it("should handle invalid currency gracefully", () => {
    const result = counterValueFormatter({
      value: 1234.56,
      currency: "INVALID",
      locale: "en-US",
    });
    expect(result).toBe("1,234.56");
  });

  it("should return - if value is NaN and it's not discreet mode", () => {
    const result = counterValueFormatter({
      value: NaN,
      locale: "en-US",
    });
    expect(result).toBe("-");
  });

  it("should return sanitized value with *** in discreet mode for NaN", () => {
    const result = counterValueFormatter({
      value: NaN,
      locale: "en-US",
      discreetMode: true,
    });
    expect(result).toBe("***");
  });
  it("should return sanitized value with *** in discreet mode for zero value", () => {
    const result = counterValueFormatter({
      value: 0,
      locale: "en-US",
      discreetMode: true,
    });
    expect(result).toBe("***");
  });
  it("should return sanitized value with *** in discreet mode for non-zero value", () => {
    const result = counterValueFormatter({
      value: 1234.56,
      locale: "en-US",
      discreetMode: true,
    });
    expect(result).toBe("***");
  });
  it("should return sanitized value with *** in discreet mode for zero value with allowZeroValue", () => {
    const result = counterValueFormatter({
      value: 0,
      locale: "en-US",
      allowZeroValue: true,
      discreetMode: true,
      currency: "USD",
    });
    expect(result).toBe("$***");
  });
});
