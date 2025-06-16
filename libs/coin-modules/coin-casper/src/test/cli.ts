import type { Account, AccountLike, AccountLikeArray } from "@ledgerhq/types-live";
import invariant from "invariant";
import flatMap from "lodash/flatMap";
import type { Transaction } from "../types";

function inferAccounts(account: Account): AccountLikeArray {
  invariant(account.currency.family === "casper", "casper family");

  const accounts: Account[] = [account];
  return accounts;
}

function inferTransactions(
  transactions: Array<{
    account: AccountLike;
    transaction: Transaction;
    mainAccount: Account;
  }>,
): Transaction[] {
  return flatMap(transactions, ({ transaction }) => {
    invariant(transaction.family === "casper", "casper family");

    return {
      ...transaction,
      family: "casper",
    } as Transaction;
  });
}

export default function makeCliTools() {
  return {
    options: [],
    inferAccounts,
    inferTransactions,
  };
}
