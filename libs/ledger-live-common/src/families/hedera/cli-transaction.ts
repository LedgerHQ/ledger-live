import invariant from "invariant";
import flatMap from "lodash/flatMap";

import type {
  Transaction,
  Account,
  AccountLike,
  AccountLikeArray,
} from "../../types";

const options = [];

function inferAccounts(account: Account): AccountLikeArray {
  invariant(account.currency.family === "hedera", "hedera family");

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
    invariant(transaction.family === "hedera", "hedera family");

    return {
      ...transaction,
      family: "hedera",
    } as Transaction;
  });
}

export default {
  options,
  inferAccounts,
  inferTransactions,
};
