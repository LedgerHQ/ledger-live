import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import { getBlockchainsWithFunds } from "./getBlockchainsWithFunds";

const funded = (currencyId: string, hasFunds: boolean) => ({
  currency: getCryptoCurrencyById(currencyId),
  balance: { gt: () => hasFunds },
});

describe("getBlockchainsWithFunds", () => {
  it("returns an empty array without accounts", () => {
    expect(getBlockchainsWithFunds([])).toEqual([]);
    expect(getBlockchainsWithFunds(undefined)).toEqual([]);
  });

  it("ignores accounts without funds", () => {
    expect(getBlockchainsWithFunds([funded("ethereum", false)])).toEqual([]);
  });

  it("distinguishes L2s that share the ETH ticker", () => {
    expect(
      getBlockchainsWithFunds([
        funded("ethereum", true),
        funded("arbitrum", true),
        funded("base", false),
      ]),
    ).toEqual(["Ethereum", "Arbitrum"]);
  });

  it("deduplicates blockchains", () => {
    expect(getBlockchainsWithFunds([funded("arbitrum", true), funded("arbitrum", true)])).toEqual([
      "Arbitrum",
    ]);
  });
});
