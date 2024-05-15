import type { Account, AccountLike, AccountLikeArray } from "@ledgerhq/types-live";
import invariant from "invariant";
import flatMap from "lodash/flatMap";
import type { Transaction } from "./types";

const options = [
  {
    name: "memo",
    type: String,
    desc: "set a memo",
  },
];

function inferAccounts(account: Account): AccountLikeArray {
  invariant(account.currency.family === "mina", "mina family");
  return [account];
}

function inferTransactions(
  transactions: Array<{
    account: AccountLike;
    transaction: Transaction;
  }>,
  opts: Record<string, any>,
): Transaction[] {
  return flatMap(transactions, ({ transaction }) => {
    invariant(transaction.family === "mina", "mina family");

    return {
      ...transaction,
      family: "mina",
      memo: opts.memo,
    };
  });
}

export default function makeCliTools() {
  return {
    options,
    inferAccounts,
    inferTransactions,
  };
}
