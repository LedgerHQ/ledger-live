import invariant from "invariant";
import flatMap from "lodash/flatMap";

import type {
  Account,
  AccountLike,
  AccountLikeArray,
} from "@ledgerhq/types-live";

import type { Transaction } from "../../generated/types";

const options = [];

function inferAccounts(account: Account): AccountLikeArray {
  invariant(account.currency.family === "stacks", "stacks family");

  const accounts: Account[] = [account];
  return accounts;
}

function inferTransactions(
  transactions: Array<{
    account: AccountLike;
    transaction: Transaction;
    mainAccount: Account;
  }>
): Transaction[] {
  return flatMap(transactions, ({ transaction }) => {
    invariant(transaction.family === "stacks", "stacks family");

    return {
      ...transaction,
      family: "stacks",
    } as Transaction;
  });
}

export default {
  options,
  inferAccounts,
  inferTransactions,
};
