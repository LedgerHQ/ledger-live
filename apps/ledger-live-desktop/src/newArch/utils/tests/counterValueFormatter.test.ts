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
    expect(result).toBe("0.00");
  });

  it("should format a number with specified decimal places set to 0", () => {
    const result = counterValueFormatter({
      value: 10.231023213,
      locale: "en-US",
      decimalPlaces: 0,
      allowZeroValue: true,
    });
    expect(result).toBe("10");
  });

  it("should format a number with specified decimal places set to 4", () => {
    const result = counterValueFormatter({
      value: 10.231023213,
      locale: "en-US",
      decimalPlaces: 4,
      allowZeroValue: true,
    });
    expect(result).toBe("10.2310");
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

  describe("Multiple locales", () => {
    it("should format German locale with EUR currency", () => {
      const result = counterValueFormatter({
        value: 1234.56,
        locale: "de-DE",
        currency: "EUR",
      });
      expect(result).toBe("1.234,56\u00A0€");
    });

    it("should handle french locale", () => {
      const result = counterValueFormatter({
        value: 10.23,
        locale: "fr-FR",
        allowZeroValue: true,
        currency: "EUR",
      });
      expect(result).toBe("10,23\u00A0€");
    });
    it("should handle french locale with allowZeroValue", () => {
      const result = counterValueFormatter({
        value: 0,
        locale: "fr-FR",
        allowZeroValue: true,
        currency: "EUR",
      });
      expect(result).toBe("0,00\u00A0€");
    });
    it("should handle french locale with USD currency", () => {
      const result = counterValueFormatter({
        value: 0,
        locale: "fr-FR",
        allowZeroValue: true,
        currency: "USD",
      });
      expect(result).toBe("0,00\u00A0$US");
    });

    it("should format German locale with zero value", () => {
      const result = counterValueFormatter({
        value: 0,
        locale: "de-DE",
        currency: "EUR",
        allowZeroValue: true,
      });
      expect(result).toBe("0,00\u00A0€");
    });

    it("should format Japanese locale with JPY currency", () => {
      const result = counterValueFormatter({
        value: 1234.56,
        locale: "ja-JP",
        currency: "JPY",
      });
      expect(result).toBe("￥1,235");
    });

    it("should format Japanese locale with zero value", () => {
      const result = counterValueFormatter({
        value: 0,
        locale: "ja-JP",
        currency: "JPY",
        allowZeroValue: true,
      });
      expect(result).toBe("￥0");
    });

    it("should format UK locale with GBP currency", () => {
      const result = counterValueFormatter({
        value: 1234.56,
        locale: "en-GB",
        currency: "GBP",
      });
      expect(result).toBe("£1,234.56");
    });

    it("should format UK locale with zero value", () => {
      const result = counterValueFormatter({
        value: 0,
        locale: "en-GB",
        currency: "GBP",
        allowZeroValue: true,
      });
      expect(result).toBe("£0.00");
    });

    it("should format Italian locale with EUR currency", () => {
      const result = counterValueFormatter({
        value: 1234.56,
        locale: "it-IT",
        currency: "EUR",
      });
      expect(result).toBe("1234,56\u00A0€");
    });

    it("should format Italian locale with zero value", () => {
      const result = counterValueFormatter({
        value: 0,
        locale: "it-IT",
        currency: "EUR",
        allowZeroValue: true,
      });
      expect(result).toBe("0,00\u00A0€");
    });

    it("should format Spanish locale with EUR currency", () => {
      const result = counterValueFormatter({
        value: 1234.56,
        locale: "es-ES",
        currency: "EUR",
      });
      expect(result).toBe("1234,56\u00A0€");
    });

    it("should format Spanish locale with zero value", () => {
      const result = counterValueFormatter({
        value: 0,
        locale: "es-ES",
        currency: "EUR",
        allowZeroValue: true,
      });
      expect(result).toBe("0,00\u00A0€");
    });

    it("should format Chinese locale with CNY currency", () => {
      const result = counterValueFormatter({
        value: 1234.56,
        locale: "zh-CN",
        currency: "CNY",
      });
      expect(result).toBe("¥1,234.56");
    });

    it("should format Chinese locale with zero value", () => {
      const result = counterValueFormatter({
        value: 0,
        locale: "zh-CN",
        currency: "CNY",
        allowZeroValue: true,
      });
      expect(result).toBe("¥0.00");
    });

    it("should format Canadian locale with CAD currency", () => {
      const result = counterValueFormatter({
        value: 1234.56,
        locale: "en-CA",
        currency: "CAD",
      });
      expect(result).toBe("$1,234.56");
    });

    it("should format Canadian locale with zero value", () => {
      const result = counterValueFormatter({
        value: 0,
        locale: "en-CA",
        currency: "CAD",
        allowZeroValue: true,
      });
      expect(result).toBe("$0.00");
    });

    it("should format Brazilian locale with BRL currency", () => {
      const result = counterValueFormatter({
        value: 1234.56,
        locale: "pt-BR",
        currency: "BRL",
      });
      expect(result).toBe("R$\u00A01.234,56");
    });

    it("should format Brazilian locale with zero value", () => {
      const result = counterValueFormatter({
        value: 0,
        locale: "pt-BR",
        currency: "BRL",
        allowZeroValue: true,
      });
      expect(result).toBe("R$\u00A00,00");
    });

    it("should format Thai locale with THB currency", () => {
      const result = counterValueFormatter({
        value: 1234.56,
        locale: "th-TH",
        currency: "THB",
      });
      expect(result).toBe("฿1,234.56");
    });

    it("should format Thai locale with zero value", () => {
      const result = counterValueFormatter({
        value: 0,
        locale: "th-TH",
        currency: "THB",
        allowZeroValue: true,
      });
      expect(result).toBe("฿0.00");
    });

    it("should format Turkish locale with TRY currency", () => {
      const result = counterValueFormatter({
        value: 1234.56,
        locale: "tr-TR",
        currency: "TRY",
      });
      expect(result).toBe("₺1.234,56");
    });

    it("should format Turkish locale with zero value", () => {
      const result = counterValueFormatter({
        value: 0,
        locale: "tr-TR",
        currency: "TRY",
        allowZeroValue: true,
      });
      expect(result).toBe("₺0,00");
    });

    it("should format Russian locale with RUB currency", () => {
      const result = counterValueFormatter({
        value: 1234.56,
        locale: "ru-RU",
        currency: "RUB",
      });
      expect(result).toBe("1\u00A0234,56\u00A0₽");
    });

    it("should format Russian locale with zero value", () => {
      const result = counterValueFormatter({
        value: 0,
        locale: "ru-RU",
        currency: "RUB",
        allowZeroValue: true,
      });
      expect(result).toBe("0,00\u00A0₽");
    });

    it("should format Indian locale with INR currency", () => {
      const result = counterValueFormatter({
        value: 1234.56,
        locale: "hi-IN",
        currency: "INR",
      });
      expect(result).toBe("₹1,234.56");
    });

    it("should format Indian locale with zero value", () => {
      const result = counterValueFormatter({
        value: 0,
        locale: "hi-IN",
        currency: "INR",
        allowZeroValue: true,
      });
      expect(result).toBe("₹0.00");
    });

    it("should format Korean locale with KRW currency", () => {
      const result = counterValueFormatter({
        value: 1234.56,
        locale: "ko-KR",
        currency: "KRW",
      });
      expect(result).toBe("₩1,235");
    });

    it("should format Korean locale with zero value", () => {
      const result = counterValueFormatter({
        value: 0,
        locale: "ko-KR",
        currency: "KRW",
        allowZeroValue: true,
      });
      expect(result).toBe("₩0");
    });

    it("should format Mexican locale with MXN currency", () => {
      const result = counterValueFormatter({
        value: 1234.56,
        locale: "es-MX",
        currency: "MXN",
      });
      expect(result).toBe("$1,234.56");
    });

    it("should format Mexican locale with zero value", () => {
      const result = counterValueFormatter({
        value: 0,
        locale: "es-MX",
        currency: "MXN",
        allowZeroValue: true,
      });
      expect(result).toBe("$0.00");
    });

    it("should format South African locale with ZAR currency", () => {
      const result = counterValueFormatter({
        value: 1234.56,
        locale: "en-ZA",
        currency: "ZAR",
      });
      expect(result).toBe("R\u00A01\u00A0234,56");
    });

    it("should format South African locale with zero value", () => {
      const result = counterValueFormatter({
        value: 0,
        locale: "en-ZA",
        currency: "ZAR",
        allowZeroValue: true,
      });
      expect(result).toBe("R\u00A00,00");
    });

    it("should format Swedish locale with SEK currency", () => {
      const result = counterValueFormatter({
        value: 1234.56,
        locale: "sv-SE",
        currency: "SEK",
      });
      expect(result).toBe("1\u00A0234,56\u00A0kr");
    });

    it("should format Swedish locale with zero value", () => {
      const result = counterValueFormatter({
        value: 0,
        locale: "sv-SE",
        currency: "SEK",
        allowZeroValue: true,
      });
      expect(result).toBe("0,00\u00A0kr");
    });

    it("should format Norwegian locale with NOK currency", () => {
      const result = counterValueFormatter({
        value: 1234.56,
        locale: "no-NO",
        currency: "NOK",
      });
      expect(result).toBe("1\u00A0234,56\u00A0kr");
    });

    it("should format Norwegian locale with zero value", () => {
      const result = counterValueFormatter({
        value: 0,
        locale: "no-NO",
        currency: "NOK",
        allowZeroValue: true,
      });
      expect(result).toBe("0,00\u00A0kr");
    });

    it("should format Swiss locale with CHF currency", () => {
      const result = counterValueFormatter({
        value: 1234.56,
        locale: "de-CH",
        currency: "CHF",
      });
      expect(result).toBe("CHF\u00A01’234.56");
    });

    it("should format Swiss locale with zero value", () => {
      const result = counterValueFormatter({
        value: 0,
        locale: "de-CH",
        currency: "CHF",
        allowZeroValue: true,
      });
      expect(result).toBe("CHF\u00A00.00");
    });

    it("should format Vietnamese locale with VND currency", () => {
      const result = counterValueFormatter({
        value: 1234.56,
        locale: "vi-VN",
        currency: "VND",
      });
      expect(result).toBe("1.235\u00A0₫");
    });

    it("should format Vietnamese locale with zero value", () => {
      const result = counterValueFormatter({
        value: 0,
        locale: "vi-VN",
        currency: "VND",
        allowZeroValue: true,
      });
      expect(result).toBe("0\u00A0₫");
    });
  });
});
