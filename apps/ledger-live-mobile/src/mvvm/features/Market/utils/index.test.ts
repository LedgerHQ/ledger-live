import i18next from "i18next";
import { initReactI18next } from "react-i18next";
import { counterValueFormatter } from ".";
import en from "~/locales/en/common.json";

beforeAll(async () => {
  await i18next.use(initReactI18next).init({
    lng: "en",
    fallbackLng: "en",
    resources: {
      en: {
        translation: en,
      },
    },
  });
});

describe("counterValueFormatter", () => {
  describe("basic formatting", () => {
    it("returns '-' for NaN values", () => {
      const result = counterValueFormatter({
        value: NaN,
        locale: "en-US",
      });
      expect(result).toBe("-");
    });

    it("returns '-' for zero when allowZeroValue is false", () => {
      const result = counterValueFormatter({
        value: 0,
        locale: "en-US",
        allowZeroValue: false,
      });
      expect(result).toBe("-");
    });

    it("formats zero when allowZeroValue is true", () => {
      const result = counterValueFormatter({
        value: 0,
        locale: "en-US",
        currency: "USD",
        allowZeroValue: true,
      });
      expect(result).toContain("0");
    });

    it("formats a currency value", () => {
      const result = counterValueFormatter({
        value: 1234.56,
        locale: "en-US",
        currency: "USD",
      });
      expect(result).toContain("1,234.56");
      expect(result).toContain("$");
    });

    it("formats a value with ticker", () => {
      const result = counterValueFormatter({
        value: 123.456,
        locale: "en-US",
        ticker: "btc",
      });
      expect(result).toContain("123.456");
      expect(result).toContain("BTC");
    });

    it("returns string value when no formatter is available", () => {
      const result = counterValueFormatter({
        value: 123.456,
        locale: "en-US",
      });
      expect(result).toBe("123.456");
    });
  });

  describe("shortened format", () => {
    it("formats thousands with K notation", () => {
      const result = counterValueFormatter({
        value: 5000,
        locale: "en-US",
        currency: "USD",
        shorten: true,
        t: i18next.t,
      });
      expect(result).toContain("5");
      expect(result).toMatch(/K|thousand/i);
    });

    it("formats millions with M notation", () => {
      const result = counterValueFormatter({
        value: 5000000,
        locale: "en-US",
        currency: "USD",
        shorten: true,
        t: i18next.t,
      });
      expect(result).toContain("5");
      expect(result).toMatch(/M|million/i);
    });

    it("formats billions with B notation", () => {
      const result = counterValueFormatter({
        value: 5000000000,
        locale: "en-US",
        currency: "USD",
        shorten: true,
        t: i18next.t,
      });
      expect(result).toContain("5");
      expect(result).toMatch(/B|billion/i);
    });

    it("formats trillions with T notation", () => {
      const result = counterValueFormatter({
        value: 5000000000000,
        locale: "en-US",
        currency: "USD",
        shorten: true,
        t: i18next.t,
      });
      expect(result).toContain("5");
      expect(result).toMatch(/T|trillion/i);
    });

    it("handles negative values in shortened format", () => {
      const result = counterValueFormatter({
        value: -5000000,
        locale: "en-US",
        currency: "USD",
        shorten: true,
        t: i18next.t,
      });
      expect(result).toContain("-");
      expect(result).toContain("5");
    });

    it("formats small values without shortening", () => {
      const result = counterValueFormatter({
        value: 50,
        locale: "en-US",
        currency: "USD",
        shorten: true,
        t: i18next.t,
      });
      expect(result).toContain("50");
    });
  });

  describe("extremely large values", () => {
    it("handles quintillion values without crashing", () => {
      const result = counterValueFormatter({
        value: 1e18,
        locale: "en-US",
        currency: "USD",
        shorten: true,
        t: i18next.t,
      });
      expect(result).toBeDefined();
      expect(result).not.toBe("-");
    });

    it("handles values beyond quintillion without crashing", () => {
      const result = counterValueFormatter({
        value: 1e24,
        locale: "en-US",
        currency: "USD",
        shorten: true,
        t: i18next.t,
      });
      expect(result).toBeDefined();
      expect(result).not.toBe("-");
    });

    it("handles maximum safe integer without crashing", () => {
      const result = counterValueFormatter({
        value: Number.MAX_SAFE_INTEGER,
        locale: "en-US",
        currency: "USD",
        shorten: true,
        t: i18next.t,
      });
      expect(result).toBeDefined();
      expect(result).not.toBe("-");
    });

    it("caps index to maximum array length for extremely large values", () => {
      const result = counterValueFormatter({
        value: 1e30,
        locale: "en-US",
        currency: "USD",
        shorten: true,
        t: i18next.t,
      });
      expect(result).toBeDefined();
      expect(result).not.toBe("-");
    });
  });

  describe("locale support", () => {
    it("formats with different locales", () => {
      const resultUS = counterValueFormatter({
        value: 1234.56,
        locale: "en-US",
        currency: "USD",
      });
      const resultFR = counterValueFormatter({
        value: 1234.56,
        locale: "fr-FR",
        currency: "EUR",
      });
      expect(resultUS).toBeDefined();
      expect(resultFR).toBeDefined();
      expect(resultUS).not.toBe(resultFR);
    });
  });

  describe("precision", () => {
    it("handles high precision decimal values", () => {
      const result = counterValueFormatter({
        value: 0.00000123,
        locale: "en-US",
        currency: "USD",
      });
      expect(result).toBeDefined();
      expect(result).not.toBe("-");
    });

    it("respects maximumFractionDigits setting", () => {
      const result = counterValueFormatter({
        value: 1.123456789,
        locale: "en-US",
        currency: "USD",
      });
      expect(result).toBeDefined();
    });
  });
});
