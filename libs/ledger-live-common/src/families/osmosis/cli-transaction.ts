import invariant from "invariant";
import flatMap from "lodash/flatMap";

import type {
  Transaction,
  Account,
  AccountLike,
  AccountLikeArray,
} from "../../types";

const options = [
  {
    name: "mode",
    type: String,
    desc: "mode of transaction: send",
  },
  {
    name: "memo",
    type: String,
    desc: "add a memo to a transaction",
  },
];

function inferAccounts(account: Account): AccountLikeArray {
  invariant(account.currency.family === "osmosis", "osmosis family");

  const accounts: Account[] = [account];
  return accounts;
}

function inferTransactions(
  transactions: Array<{
    account: AccountLike;
    transaction: Transaction;
    mainAccount: Account;
  }>,
  opts: Record<string, any>,
  { inferAmount }: any
): Transaction[] {
  return flatMap(transactions, ({ transaction, account }) => {
    invariant(transaction.family === "osmosis", "osmosis family");

    return {
      ...transaction,
      family: "osmosis",
      mode: opts.mode || "send",
      fees: opts.fees ? inferAmount(account, opts.fees) : null,
      memo: opts.memo,
    } as Transaction;
  });
}

export default {
  options,
  inferAccounts,
  inferTransactions,
};
