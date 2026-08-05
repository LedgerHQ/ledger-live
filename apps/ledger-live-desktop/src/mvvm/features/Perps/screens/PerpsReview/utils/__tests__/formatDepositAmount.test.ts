import BigNumber from "bignumber.js";
import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import type { AccountLike } from "@ledgerhq/types-live";
import { formatDepositAmount } from "../formatDepositAmount";

const account = {
  type: "Account",
  id: "eth-1",
  currency: getCryptoCurrencyById("ethereum"),
  spendableBalance: new BigNumber(0),
  balance: new BigNumber(0),
} as AccountLike;

describe("formatDepositAmount", () => {
  it("should format the amount in its own currency", () => {
    expect(formatDepositAmount({ value: "1", currencyId: "ethereum" }, account)).toMatch(
      /^1[\s\u00A0]ETH$/,
    );
  });

  it("should return an empty string when the amount has no value", () => {
    expect(formatDepositAmount({ value: "", currencyId: "ethereum" }, account)).toBe("");
  });

  it("should fall back to the account currency for an unknown currency id", () => {
    expect(formatDepositAmount({ value: "1", currencyId: "not-a-currency" }, account)).toMatch(
      /^1[\s\u00A0]ETH$/,
    );
  });
});
