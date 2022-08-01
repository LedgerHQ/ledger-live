import { BigNumber } from "bignumber.js";
import { flattenAccounts, getAccountCurrency } from "./helpers";
import type { FlattenAccountsOptions } from "./helpers";
import type { Account, AccountLike } from "@ledgerhq/types-live";
import type {
  CryptoCurrency,
  TokenCurrency,
} from "@ledgerhq/types-cryptoassets";

export type AccountComparator = (a: AccountLike, b: AccountLike) => number;

const sortNameLense = (a: AccountLike): string => {
  switch (a.type) {
    case "Account":
      return a.name;

    case "TokenAccount":
      return a.token.name;

    case "ChildAccount":
      return a.currency.name;

    default:
      return "";
  }
};

export const sortAccountsComparatorFromOrder = (
  orderAccounts: string,
  calculateCountervalue: (
    currency: TokenCurrency | CryptoCurrency,
    value: BigNumber
  ) => BigNumber | null | undefined
): AccountComparator => {
  const [order, sort] = orderAccounts.split("|");
  const ascValue = sort === "desc" ? -1 : 1;

  if (order === "name") {
    return (a, b) =>
      ascValue *
      sortNameLense(a).localeCompare(sortNameLense(b), undefined, {
        numeric: true,
      });
  }

  const cvCaches = {};

  const lazyCalcCV = (a) => {
    if (a.id in cvCaches) return cvCaches[a.id];
    const v =
      calculateCountervalue(getAccountCurrency(a), a.balance) ||
      new BigNumber(-1);
    cvCaches[a.id] = v;
    return v;
  };

  return (a, b) => {
    const diff = ascValue * lazyCalcCV(a).minus(lazyCalcCV(b)).toNumber();
    if (diff === 0) return sortNameLense(a).localeCompare(sortNameLense(b));
    return diff;
  };
};
export const comparatorSortAccounts = <TA extends AccountLike>(
  accounts: TA[],
  comparator: AccountComparator
): TA[] => {
  const meta = accounts
    .map((ta, index) => ({
      account: ta,
      index,
    }))
    .sort((a, b) => comparator(a.account, b.account));

  if (meta.every((m, i) => m.index === i)) {
    // account ordering is preserved, we keep the same array reference (this should happen most of the time)
    return accounts;
  }

  // otherwise, need to reorder
  return meta.map((m) => accounts[m.index]);
};
// flatten accounts and sort between them (used for grid mode)
export const flattenSortAccounts = (
  accounts: Account[],
  comparator: AccountComparator,
  o?: FlattenAccountsOptions
): AccountLike[] => {
  return comparatorSortAccounts(flattenAccounts(accounts, o), comparator);
};
// sort top level accounts and the inner sub accounts if necessary (used for lists)
export const nestedSortAccounts = (
  topAccounts: Account[],
  comparator: AccountComparator
): Account[] => {
  let oneAccountHaveChanged = false;
  // first of all we sort the inner token accounts
  const accounts = topAccounts.map((a) => {
    if (!a.subAccounts) return a;
    const subAccounts = comparatorSortAccounts(a.subAccounts, comparator);
    if (subAccounts === a.subAccounts) return a;
    oneAccountHaveChanged = true;
    return { ...a, subAccounts };
  });
  // then we sort again between them
  return comparatorSortAccounts(
    oneAccountHaveChanged ? accounts : topAccounts,
    comparator
  );
};
