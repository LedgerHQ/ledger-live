// @flow
import { BigNumber } from "bignumber.js";
import type {
  Account,
  TokenAccount,
  TokenCurrency,
  CryptoCurrency
} from "../types";
import { flattenAccounts } from "./helpers";
import type { FlattenAccountsOptions } from "./helpers";

type AccountComparator = (
  a: Account | TokenAccount,
  b: Account | TokenAccount
) => number;

const sortNameLense = (a: Account | TokenAccount): string =>
  a.type === "Account" ? a.name : a.token.name;

export const sortAccountsComparatorFromOrder = (
  orderAccounts: string,
  calculateCountervalue: (
    currency: TokenCurrency | CryptoCurrency,
    value: BigNumber
  ) => ?BigNumber
): AccountComparator => {
  const [order, sort] = orderAccounts.split("|");
  const ascValue = sort === "desc" ? -1 : 1;
  if (order === "name") {
    return (a, b) =>
      ascValue * sortNameLense(a).localeCompare(sortNameLense(b));
  }
  const cvCaches = {};
  const lazyCalcCV = a => {
    if (a.id in cvCaches) return cvCaches[a.id];
    const v =
      calculateCountervalue(
        a.type === "Account" ? a.currency : a.token,
        a.balance
      ) || BigNumber(-1);
    cvCaches[a.id] = v;
    return v;
  };
  return (a, b) => {
    const diff =
      ascValue *
      lazyCalcCV(a)
        .minus(lazyCalcCV(b))
        .toNumber();
    if (diff === 0) return sortNameLense(a).localeCompare(sortNameLense(b));
    return diff;
  };
};

export const comparatorSortAccounts = <TA: Account | TokenAccount>(
  accounts: TA[],
  comparator: AccountComparator
): TA[] => {
  const meta = accounts
    .map((ta, index) => ({
      account: ta,
      index
    }))
    .sort((a, b) => comparator(a.account, b.account));
  if (meta.every((m, i) => m.index === i)) {
    // account ordering is preserved, we keep the same array reference (this should happen most of the time)
    return accounts;
  }
  // otherwise, need to reorder
  return meta.map(m => accounts[m.index]);
};

// flatten accounts and sort between them (used for grid mode)
export const flattenSortAccounts = (
  accounts: Account[],
  comparator: AccountComparator,
  o?: FlattenAccountsOptions
): (Account | TokenAccount)[] => {
  return comparatorSortAccounts(flattenAccounts(accounts, o), comparator);
};

// sort top level accounts and the inner token accounts if necessary (used for lists)
export const nestedSortAccounts = (
  topAccounts: Account[],
  comparator: AccountComparator
): Account[] => {
  let oneAccountHaveChanged = false;
  // first of all we sort the inner token accounts
  const accounts = topAccounts.map(a => {
    if (!a.tokenAccounts) return a;
    const tokenAccounts = comparatorSortAccounts(a.tokenAccounts, comparator);
    if (tokenAccounts === a.tokenAccounts) return a;
    oneAccountHaveChanged = true;
    return {
      ...a,
      tokenAccounts
    };
  });
  // then we sort again between them
  return comparatorSortAccounts(
    oneAccountHaveChanged ? accounts : topAccounts,
    comparator
  );
};
