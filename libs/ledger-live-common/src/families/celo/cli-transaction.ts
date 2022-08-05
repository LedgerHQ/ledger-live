import type {
  Account,
  AccountLike,
  AccountLikeArray,
} from "@ledgerhq/types-live";
import invariant from "invariant";
import flatMap from "lodash/flatMap";
import type { Transaction } from "../celo/types";

const options = [];

function inferAccounts(account: Account): AccountLikeArray {
  invariant(account.currency.family === "celo", "celo family");

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
    invariant(transaction.family === "celo", "celo family");

    return {
      ...transaction,
      family: "celo",
    } as Transaction;
  });
}

export default {
  options,
  inferAccounts,
  inferTransactions,
};
