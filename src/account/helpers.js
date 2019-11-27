// @flow
import invariant from "invariant";
import type {
  AccountLike,
  AccountLikeArray,
  Account,
  Unit,
  SubAccount
} from "../types";
import { getEnv } from "../env";

// by convention, a main account is the top level account
// in case of an Account is the account itself
// in case of a TokenAccount it's the parentAccount
export const getMainAccount = (
  account: AccountLike,
  parentAccount: ?Account
): Account => {
  const mainAccount = account.type === "Account" ? account : parentAccount;
  invariant(mainAccount, "an account is expected");
  return mainAccount;
};

export const getAccountCurrency = (account: AccountLike) => {
  switch (account.type) {
    case "Account":
    case "ChildAccount":
      return account.currency;
    case "TokenAccount":
      return account.token;
    default:
      throw new Error("invalid account.type=" + account.type);
  }
};

export const getAccountUnit = (account: AccountLike): Unit => {
  switch (account.type) {
    case "Account":
      return account.unit;
    case "TokenAccount":
      return account.token.units[0];
    case "ChildAccount":
      return account.currency.units[0];
    default:
      throw new Error("invalid account.type=" + account.type);
  }
};

export const getAccountName = (account: AccountLike): string => {
  switch (account.type) {
    case "Account":
    case "ChildAccount":
      return account.name;
    case "TokenAccount":
      return account.token.name;
    default:
      throw new Error("invalid account.type=" + account.type);
  }
};

export const isAccountEmpty = (a: AccountLike): boolean => {
  const hasSubAccounts =
    a.type === "Account" && a.subAccounts && a.subAccounts.length;
  return a.operations.length === 0 && a.balance.isZero() && !hasSubAccounts;
};

export const isAccountBalanceSignificant = (a: AccountLike): boolean =>
  a.balance.gt(100); // in future, could be a per currency thing

// clear account to a bare minimal version that can be restored via sync
// will preserve the balance to avoid user panic
export function clearAccount<T: AccountLike>(account: T): T {
  if (account.type === "TokenAccount") {
    return {
      ...account,
      operations: [],
      pendingOperations: []
    };
  }

  if (account.type === "ChildAccount") {
    return {
      ...account,
      operations: [],
      pendingOperations: []
    };
  }

  return {
    ...account,
    lastSyncDate: new Date(0),
    operations: [],
    pendingOperations: [],
    subAccounts: account.subAccounts && account.subAccounts.map(clearAccount)
  };
}

export function findSubAccountById(account: Account, id: string): ?SubAccount {
  return (account.subAccounts || []).find(a => a.id === id);
}

// get the token accounts of an account, ignoring those that are zero IF user don't want them
export function listSubAccounts(account: Account): SubAccount[] {
  const accounts = account.subAccounts || [];
  if (getEnv("HIDE_EMPTY_TOKEN_ACCOUNTS")) {
    return accounts.filter(a => !a.balance.isZero());
  }
  return accounts;
}

export type FlattenAccountsOptions = {
  enforceHideEmptySubAccounts?: boolean
};

export function flattenAccounts(
  topAccounts: AccountLikeArray,
  o: FlattenAccountsOptions = {}
): AccountLike[] {
  const accounts = [];
  for (let i = 0; i < topAccounts.length; i++) {
    const account = topAccounts[i];
    accounts.push(account);
    if (account.type === "Account") {
      const subAccounts = o.enforceHideEmptySubAccounts
        ? listSubAccounts(account)
        : account.subAccounts || [];
      for (let j = 0; j < subAccounts.length; j++) {
        accounts.push(subAccounts[j]);
      }
    }
  }
  return accounts;
}

export const shortAddressPreview = (addr: string, target: number = 20) => {
  const slice = Math.floor((target - 3) / 2);
  return addr.length < target - 3
    ? addr
    : `${addr.slice(0, slice)}...${addr.slice(addr.length - slice)}`;
};
