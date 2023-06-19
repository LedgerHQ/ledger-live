import type { Account, AccountLike, AccountLikeArray } from "@ledgerhq/types-live";
import invariant from "invariant";
import flatMap from "lodash/flatMap";
import type { Transaction } from "../../generated/types";

const options = [];

function inferAccounts(account: Account): AccountLikeArray {
  invariant(account.currency.family === "filecoin", "filecoin family");

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
    invariant(transaction.family === "filecoin", "filecoin family");

    return {
      ...transaction,
      family: "filecoin",
    } as Transaction;
  });
}

export default {
  options,
  inferAccounts,
  inferTransactions,
};
