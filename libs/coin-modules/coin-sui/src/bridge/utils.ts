import { AccountLike } from "@ledgerhq/types-live";

export enum AccountType {
  Account = "Account",
  TokenAccount = "TokenAccount",
}

export function getAccountUnit(account: AccountLike) {
  if (account.type === AccountType.TokenAccount) {
    return account.token.units[0];
  }

  return account.currency.units[0];
}
