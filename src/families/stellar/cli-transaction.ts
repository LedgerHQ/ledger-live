import invariant from "invariant";
import type { Transaction, AccountLike } from "../../types";
const options = [
  {
    name: "fee",
    type: String,
    desc: "how much fee",
  },
  {
    name: "memoType",
    type: String,
    desc: "stellar memo type",
  },
  {
    name: "memoValue",
    type: String,
    desc: "stellar memo value",
  },
];

function inferTransactions(
  transactions: Array<{
    account: AccountLike;
    transaction: Transaction;
  }>,
  opts: Record<string, any>
): Transaction[] {
  return transactions.map(({ transaction }) => {
    invariant(transaction.family === "stellar", "stellar family");
    return {
      ...transaction,
      memoType: opts.memoType,
      memoValue: opts.memoValue,
    };
  });
}

export default {
  options,
  inferTransactions,
};
