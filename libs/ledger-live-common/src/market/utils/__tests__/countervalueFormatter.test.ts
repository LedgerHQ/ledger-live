import { findCryptoCurrencyByTicker } from "@domain/entity-currency-crypto";
import { findFiatCurrencyByTicker } from "@domain/entity-currency-fiat";
import { counterValueFormatter } from "../countervalueFormatter";

const usd = findFiatCurrencyByTicker("USD")!.units[0];
const cad = findFiatCurrencyByTicker("CAD")!.units[0];
const eur = findFiatCurrencyByTicker("EUR")!.units[0];
// BTC is defined as a FiatCurrency (₿) in our registry; ETH is a CryptoCurrency.
const btc = findFiatCurrencyByTicker("BTC")!.units[0];
const eth = findCryptoCurrencyByTicker("ETH")!.units[0];

describe("counterValueFormatter (live-common)", () => {
  it("returns '-' for falsy values", () => {
    expect(counterValueFormatter({ value: 0, locale: "en-US" })).toBe("-");
    expect(counterValueFormatter({ value: undefined, locale: "en-US" })).toBe("-");
  });

  it("formats a currency value", () => {
    const result = counterValueFormatter({
      value: 1234.56,
      locale: "en-US",
      unit: usd,
    });
    expect(result).toContain("$");
    expect(result).toContain("1,234.56");
  });

  it("formats in compact notation when shorten is true", () => {
    const result = counterValueFormatter({
      value: 21_000_000,
      locale: "en-US",
      shorten: true,
    });
    expect(result).toMatch(/21M/i);
  });

  it("appends an uppercased ticker after the formatted value", () => {
    const result = counterValueFormatter({
      value: 21_000_000,
      locale: "en-US",
      shorten: true,
      ticker: "btc",
    });
    expect(result).toMatch(/^21M BTC$/);
  });

  it("does not append anything when ticker is empty or whitespace", () => {
    expect(counterValueFormatter({ value: 100, locale: "en-US", ticker: "" })).toBe("100");
    expect(counterValueFormatter({ value: 100, locale: "en-US", ticker: "   " })).toBe("100");
  });

  it("does not append a ticker for the falsy '-' branch", () => {
    expect(counterValueFormatter({ value: 0, locale: "en-US", ticker: "btc" })).toBe("-");
  });

  it("renders the Ledger fiat sign instead of the localized code", () => {
    // USD: previously rendered US$/$US in non-US locales
    expect(counterValueFormatter({ value: 1234.56, locale: "en-GB", unit: usd })).toBe("$1,234.56");
    expect(counterValueFormatter({ value: 1234.56, locale: "en-US", unit: usd })).toBe("$1,234.56");
  });

  it("uses the same fiat sign regardless of locale so Market matches price and balances", () => {
    // CAD: Intl narrowSymbol is locale-dependent ("$" in en-CA, "CA$" in en-US),
    // but the Ledger fiat definition pins it to "CA$" everywhere.
    expect(counterValueFormatter({ value: 1234.56, locale: "en-US", unit: cad })).toBe(
      "CA$1,234.56",
    );
    expect(counterValueFormatter({ value: 1234.56, locale: "en-CA", unit: cad })).toBe(
      "CA$1,234.56",
    );
  });

  it("formats compact BTC countervalues without exceeding Intl fraction digit bounds", () => {
    expect(
      counterValueFormatter({
        value: 21_000_000,
        locale: "en-US",
        unit: btc,
        shorten: true,
      }),
    ).toContain("₿");
  });

  it("formats compact ETH countervalues without falling back to Intl currency style", () => {
    expect(
      counterValueFormatter({
        value: 21_000_000,
        locale: "en-US",
        unit: eth,
        shorten: true,
      }),
    ).toContain("ETH");
  });

  it("formats EUR with the Ledger-pinned sign", () => {
    const result = counterValueFormatter({
      value: 1234.56,
      locale: "en-US",
      unit: eur,
    });
    expect(result).toContain("1,234.56");
    expect(result).toMatch(/€/);
  });

  it("formats BTC without shorten using magnitude-based fraction digits (8 decimals)", () => {
    const result = counterValueFormatter({
      value: 1.123456789,
      locale: "en-US",
      unit: btc,
      shorten: false,
    });
    // BTC magnitude is 8 → maximumFractionDigits = 8, Intl rounds (not truncates)
    expect(result).toContain("₿");
    expect(result).toMatch(/1\.12345679/);
  });

  it("formats a value without currency as plain decimal", () => {
    const result = counterValueFormatter({ value: 1234.56, locale: "en-US" });
    expect(result).toBe("1,234.56");
  });
});
