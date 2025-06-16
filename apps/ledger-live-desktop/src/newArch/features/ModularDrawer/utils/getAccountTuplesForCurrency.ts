import type { Account, TokenAccount } from "@ledgerhq/types-live";
import { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { makeEmptyTokenAccount } from "@ledgerhq/coin-framework/lib-es/account/helpers";

export type AccountTuple = {
  account: Account;
  subAccount: TokenAccount | null;
};

export function getAccountTuplesForCurrency(
  currency: CryptoCurrency | TokenCurrency,
  allAccounts: Account[],
): AccountTuple[] {
  const isToken = currency.type === "TokenCurrency";

  return allAccounts
    .filter(account => {
      if (isToken) return account.currency.id === currency.parentCurrency.id;

      return account.currency.id === currency.id;
    })
    .map(account => {
      if (isToken) {
        const subAccount =
          account.subAccounts?.find(
            (subAcc: TokenAccount) =>
              subAcc.type === "TokenAccount" && subAcc.token.id === currency.id,
          ) || makeEmptyTokenAccount(account, currency);

        return { account, subAccount };
      }
      return { account, subAccount: null };
    });
}
