import { describe, expect, it } from "bun:test";
import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import type { Account, TokenAccount } from "@ledgerhq/types-live";
import { parseAmountWithTicker } from "./parse-amount";

const ethCurrency = getCryptoCurrencyById("ethereum");

const ethAccount = {
  currency: ethCurrency,
  subAccounts: [],
} as unknown as Account;

const ethWithUsdt = {
  currency: ethCurrency,
  subAccounts: [
    {
      type: "TokenAccount" as const,
      token: {
        ticker: "USDT",
        id: "ethereum/erc20/usd~!underscore!~tether",
        units: [{ magnitude: 6, name: "USD Tether", code: "USDT" }],
      },
    } as unknown as TokenAccount,
  ],
} as unknown as Account;

describe("parseAmountWithTicker", () => {
  it("parses 'NUMBER TICKER' format for native currency", () => {
    const { assetId, amount } = parseAmountWithTicker("0.5 ETH", ethAccount);
    expect(assetId).toBe("ethereum");
    expect(amount.toFixed()).toBe("500000000000000000");
  });

  it("parses 'TICKER NUMBER' format", () => {
    const { assetId, amount } = parseAmountWithTicker("ETH 0.5", ethAccount);
    expect(assetId).toBe("ethereum");
    expect(amount.toFixed()).toBe("500000000000000000");
  });

  it("parses without space between number and ticker", () => {
    const { assetId, amount } = parseAmountWithTicker("1ETH", ethAccount);
    expect(assetId).toBe("ethereum");
    expect(amount.isGreaterThan(0)).toBe(true);
  });

  it("is case-insensitive for ticker", () => {
    const { assetId } = parseAmountWithTicker("0.1 eth", ethAccount);
    expect(assetId).toBe("ethereum");
  });

  it("parses a token amount from subAccount", () => {
    const { assetId, amount } = parseAmountWithTicker("10 USDT", ethWithUsdt);
    expect(assetId).toBe("ethereum/erc20/usd~!underscore!~tether");
    expect(amount.toFixed()).toBe("10000000"); // magnitude 6
  });

  it("throws when format is missing ticker", () => {
    expect(() => parseAmountWithTicker("0.5", ethAccount)).toThrow(/ticker/i);
  });

  it("throws when ticker is not found in account", () => {
    expect(() => parseAmountWithTicker("0.5 BTC", ethAccount)).toThrow(/BTC/);
  });

  it("throws listing available tickers in error message", () => {
    expect(() => parseAmountWithTicker("0.5 BTC", ethWithUsdt)).toThrow(/ETH|USDT/);
  });
});
