import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { getAccountsWithFunds } from "./getAccountsWithFunds";

const funded = (currencyId: string, hasFunds: boolean) => ({
  currency: getCryptoCurrencyById(currencyId),
  balance: { isGreaterThan: () => hasFunds },
});

describe("getAccountsWithFunds", () => {
  it("returns an empty array without accounts", () => {
    expect(getAccountsWithFunds([])).toEqual([]);
    expect(getAccountsWithFunds(undefined)).toEqual([]);
  });

  it("ignores accounts without funds and deduplicates tickers", () => {
    expect(
      getAccountsWithFunds([
        funded("bitcoin", false),
        funded("ethereum", true),
        funded("ethereum", true),
      ]),
    ).toEqual(["ETH"]);
  });

  it("collapses L2s that share the ETH ticker", () => {
    expect(
      getAccountsWithFunds([
        funded("ethereum", true),
        funded("arbitrum", true),
        funded("base", true),
      ]),
    ).toEqual(["ETH"]);
  });
});
