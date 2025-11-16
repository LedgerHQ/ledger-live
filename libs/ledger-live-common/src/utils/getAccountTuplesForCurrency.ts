import type { Account, TokenAccount } from "@ledgerhq/types-live";
import { CryptoCurrency, TokenCurrency } from "@ledgerhq/types-cryptoassets";
import { makeEmptyTokenAccount } from "@ledgerhq/coin-framework/account/helpers";

export type AccountTuple = {
  account: Account;
  subAccount: TokenAccount | null;
};

export function getAccountTuplesForCurrency(
  currency: CryptoCurrency | TokenCurrency,
  allAccounts: Account[],
): AccountTuple[] {
  const isToken = currency.type === "TokenCurrency";
  const targetCurrencyId = isToken ? currency.parentCurrency.id : currency.id;

  return allAccounts
    .filter(account => account.currency.id === targetCurrencyId)
    .map(account => {
      const subAccount = isToken
        ? account.subAccounts?.find(
            (subAcc): subAcc is TokenAccount =>
              subAcc.type === "TokenAccount" && subAcc.token.id === currency.id,
          ) || makeEmptyTokenAccount(account, currency)
        : null;

      return { account, subAccount };
    });
}
