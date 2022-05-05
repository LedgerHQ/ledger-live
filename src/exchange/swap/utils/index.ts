import { CryptoCurrency, TokenCurrency } from "@ledgerhq/cryptoassets";
import { makeEmptyTokenAccount } from "../../../account";
import { Account, SubAccount, TokenAccount } from "../../../types";
import type { ExchangeRate } from "../types";
import { getAccountCurrency } from "../../../account";

export const KYC_STATUS = {
  pending: "pending",
  rejected: "closed",
  approved: "approved",
};

export type KYCStatus = keyof typeof KYC_STATUS;

export const pickExchangeRate = (
  exchangeRates: ExchangeRate[],
  exchangeRate: ExchangeRate | null | undefined,
  setExchangeRate: (rate?: ExchangeRate | null) => void
): void => {
  const hasRates = exchangeRates?.length > 0;
  // If the user picked an exchange rate before, try to select the new one that matches.
  // Otherwise pick the first one.
  const rate =
    hasRates &&
    ((exchangeRate &&
      exchangeRates.find(
        ({ tradeMethod, provider }) =>
          tradeMethod === exchangeRate.tradeMethod &&
          provider === exchangeRate.provider
      )) ||
      exchangeRates[0]);
  setExchangeRate(rate || null);
};

export type AccountTuple = {
  account: Account | null | undefined;
  subAccount: SubAccount | null | undefined;
};

export function getAccountTuplesForCurrency(
  currency: CryptoCurrency | TokenCurrency,
  allAccounts: Account[],
  hideEmpty?: boolean
): AccountTuple[] {
  if (currency.type === "TokenCurrency") {
    return allAccounts
      .filter((account) => account.currency.id === currency.parentCurrency.id)
      .map((account) => ({
        account,
        subAccount:
          (account.subAccounts &&
            account.subAccounts.find(
              (subAcc: SubAccount) =>
                subAcc.type === "TokenAccount" &&
                subAcc.token.id === currency.id
            )) ||
          makeEmptyTokenAccount(account, currency),
      }))
      .filter((a) => (hideEmpty ? a.subAccount?.balance.gt(0) : true));
  }
  return allAccounts
    .filter((account) => account.currency.id === currency.id)
    .map((account) => ({
      account,
      subAccount: null,
    }))
    .filter((a) => (hideEmpty ? a.account?.balance.gt(0) : true));
}

export const getAvailableAccountsById = (
  id: string,
  accounts: ((Account | TokenAccount) & { disabled?: boolean })[]
): ((Account | TokenAccount) & {
  disabled?: boolean | undefined;
})[] =>
  accounts
    .filter((acc) => getAccountCurrency(acc)?.id === id && !acc.disabled)
    .sort((a, b) => b.balance.minus(a.balance).toNumber());
