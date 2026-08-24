import { CryptoOrTokenCurrency } from "@domain/entity-currency";
import { AccountLike, Account } from "@ledgerhq/types-live";
import { isAccount, isAccountEmpty } from "@ledgerhq/ledger-wallet-framework/account/helpers";
import { isTokenAccount } from "@ledgerhq/live-common/account/index";

export type AccountWithParent = {
  account: AccountLike;
  parentAccount?: Account;
};

export function resolveCurrencyIds(
  currency?: CryptoOrTokenCurrency,
  currencyIds?: string[],
): string[] {
  if (currencyIds?.length) {
    return [...new Set(currencyIds.filter(Boolean))];
  }
  return currency ? [currency.id] : [];
}

export function getAccountsForCurrencies(
  flattenedAccounts: AccountLike[],
  shallowAccounts: Account[],
  currencyIds: string[],
): AccountWithParent[] {
  const ids = new Set(currencyIds);
  const accountsById = new Map(shallowAccounts.map(account => [account.id, account]));

  return flattenedAccounts
    .filter(account => {
      const currencyId = account.type === "TokenAccount" ? account.token.id : account.currency.id;
      return ids.has(currencyId) && !isAccountEmpty(account);
    })
    .map(account => {
      const parentId = isTokenAccount(account) ? account.parentId : undefined;
      const parent = parentId ? accountsById.get(parentId) : undefined;
      const parentAccount = parent && isAccount(parent) ? parent : undefined;
      return { account, parentAccount };
    });
}
