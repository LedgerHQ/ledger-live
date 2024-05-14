import type { Account, AccountLike, AccountLikeArray } from "@ledgerhq/types-live";
import invariant from "invariant";
import flatMap from "lodash/flatMap";
import type { Transaction } from "../types/common";

const options = [
  {
    name: "memo",
    type: String,
    desc: "mina: set a memo",
  },
  {
    name: "delegateAddress",
    type: String,
    desc: "mina: delegate to a validator",
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
  opts: Record<string, string>,
): Transaction[] {
  return flatMap(transactions, ({ transaction }) => {
    invariant(transaction.family === "mina", "mina family");

    if (opts.delegateAddress) {
      return {
        ...transaction,
        family: "mina",
        txType: "stake",
        recipient: opts.delegateAddress,
      };
    }

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
