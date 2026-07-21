import type { Account, AccountLike, TokenAccount } from "@ledgerhq/types-live";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { getIncompatibleCurrencyKeys } from "./getIncompatibleCurrencyKeys";
import type { ExchangeSwap } from "./types";

// getIncompatibleCurrencyKeys only reads `type`, `currency.id` and `token.parentCurrencyId`
// off the accounts, so minimal account-like fixtures keep the test hermetic and fast.
const account = (currencyId: string): Account =>
  ({ type: "Account", currency: { id: currencyId } as CryptoCurrency }) as unknown as Account;

const tokenAccount = (parentCurrencyId: string): TokenAccount =>
  ({ type: "TokenAccount", token: { parentCurrencyId } }) as unknown as TokenAccount;

const swap = (fromAccount: AccountLike, toAccount: AccountLike): ExchangeSwap =>
  ({
    fromParentAccount: null,
    fromAccount,
    toParentAccount: null,
    toAccount,
  }) as unknown as ExchangeSwap;

const ALEO_KEYS = {
  title: "swap.incompatibility.aleo_title",
  description: "swap.incompatibility.aleo_description",
};

describe("getIncompatibleCurrencyKeys", () => {
  it("flags Aleo as the source (from) currency", () => {
    expect(getIncompatibleCurrencyKeys(swap(account("aleo"), account("bitcoin")))).toEqual(ALEO_KEYS);
  });

  it("flags Aleo as the destination (to) currency", () => {
    expect(getIncompatibleCurrencyKeys(swap(account("bitcoin"), account("aleo")))).toEqual(ALEO_KEYS);
  });

  it("returns undefined when neither side is incompatible", () => {
    expect(
      getIncompatibleCurrencyKeys(swap(account("bitcoin"), account("ethereum"))),
    ).toBeUndefined();
  });

  it("does not flag an Aleo token account (Aleo has no entry in the token-parent map)", () => {
    expect(
      getIncompatibleCurrencyKeys(swap(tokenAccount("aleo"), account("bitcoin"))),
    ).toBeUndefined();
  });
});
