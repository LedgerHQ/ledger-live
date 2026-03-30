import i18next from "i18next";
import { initReactI18next } from "react-i18next";
import {
  counterValueFormatter,
  getDateFormatter,
  getAnalyticsProperties,
  isDataStale,
  getCurrentPage,
} from ".";
import { Order } from "@ledgerhq/live-common/market/utils/types";
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

describe("getDateFormatter", () => {
  it("should return a DateTimeFormat for 24h interval", () => {
    const formatter = getDateFormatter("en-US", "24h");
    expect(formatter).toBeInstanceOf(Intl.DateTimeFormat);
    const parts = formatter.formatToParts(new Date(2024, 0, 15, 14, 30));
    const partTypes = parts.map(p => p.type);
    expect(partTypes).toContain("hour");
    expect(partTypes).toContain("minute");
  });

  it("should return a DateTimeFormat for 7d interval", () => {
    const formatter = getDateFormatter("en-US", "7d");
    const parts = formatter.formatToParts(new Date(2024, 0, 15, 14, 30));
    const partTypes = parts.map(p => p.type);
    expect(partTypes).toContain("year");
    expect(partTypes).toContain("month");
    expect(partTypes).toContain("day");
    expect(partTypes).toContain("hour");
  });

  it("should return a DateTimeFormat for 30d interval", () => {
    const formatter = getDateFormatter("en-US", "30d");
    const parts = formatter.formatToParts(new Date(2024, 0, 15));
    const partTypes = parts.map(p => p.type);
    expect(partTypes).toContain("month");
    expect(partTypes).toContain("day");
  });

  it("should fall back to default formatter for unknown intervals", () => {
    const formatter = getDateFormatter("en-US", "unknown");
    const defaultFormatter = getDateFormatter("en-US", "default");
    expect(formatter).toBe(defaultFormatter);
  });

  it("should cache formatters per locale", () => {
    const first = getDateFormatter("en-US", "24h");
    const second = getDateFormatter("en-US", "24h");
    expect(first).toBe(second);
  });

  it("should create separate formatters for different locales", () => {
    const usFormatter = getDateFormatter("en-US", "24h");
    const frFormatter = getDateFormatter("fr-FR", "24h");
    expect(usFormatter).not.toBe(frFormatter);
  });
});

describe("getAnalyticsProperties", () => {
  it("should return correct shape with order and range", () => {
    const result = getAnalyticsProperties({
      order: Order.MarketCapDesc,
      range: "24h",
      counterCurrency: "usd",
      liveCompatible: false,
    });

    expect(result).toEqual(
      expect.objectContaining({
        access: false,
        sort: expect.any(String),
        "%change": "24h",
        countervalue: "usd",
        view: "All coins",
      }),
    );
  });

  it("should set view to 'Only Live Supported' when liveCompatible is true", () => {
    const result = getAnalyticsProperties({
      order: Order.MarketCapDesc,
      range: "24h",
      counterCurrency: "usd",
      liveCompatible: true,
    });

    expect(result.view).toBe("Only Live Supported");
  });

  it("should not include sort when order is missing", () => {
    const result = getAnalyticsProperties({
      range: "24h",
      counterCurrency: "usd",
    });

    expect(result).not.toHaveProperty("sort");
  });

  it("should not include sort when range is missing", () => {
    const result = getAnalyticsProperties({
      order: Order.MarketCapDesc,
      counterCurrency: "usd",
    });

    expect(result).not.toHaveProperty("sort");
  });

  it("should merge otherProperties into the result", () => {
    const result = getAnalyticsProperties(
      { order: Order.MarketCapDesc, range: "24h", counterCurrency: "usd" },
      { currencies: ["bitcoin", "ethereum"] },
    );

    expect(result).toHaveProperty("currencies", ["bitcoin", "ethereum"]);
  });
});

describe("isDataStale", () => {
  it("should return true when elapsed time exceeds refreshRate", () => {
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    const threeMinuteRate = 3 * 60 * 1000;
    expect(isDataStale(fiveMinutesAgo, threeMinuteRate)).toBe(true);
  });

  it("should return false when elapsed time is within refreshRate", () => {
    const oneMinuteAgo = Date.now() - 1 * 60 * 1000;
    const threeMinuteRate = 3 * 60 * 1000;
    expect(isDataStale(oneMinuteAgo, threeMinuteRate)).toBe(false);
  });

  it("should return false when lastUpdate is now", () => {
    expect(isDataStale(Date.now(), 60000)).toBe(false);
  });
});

describe("getCurrentPage", () => {
  it("should return page 1 for index 0", () => {
    expect(getCurrentPage(0, 50)).toBe(1);
  });

  it("should return page 1 for index 49 with pageSize 50", () => {
    expect(getCurrentPage(49, 50)).toBe(1);
  });

  it("should return page 2 for index 50 with pageSize 50", () => {
    expect(getCurrentPage(50, 50)).toBe(2);
  });

  it("should return page 3 for index 100 with pageSize 50", () => {
    expect(getCurrentPage(100, 50)).toBe(3);
  });

  it("should handle pageSize of 10", () => {
    expect(getCurrentPage(25, 10)).toBe(3);
  });
});
