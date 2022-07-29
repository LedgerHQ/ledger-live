import invariant from "invariant";
import flatMap from "lodash/flatMap";

import type { Transaction, AccountLike } from "../../types";

const options = [
  {
    name: "mode",
    type: String,
    desc: "mode of transaction: delegate",
  },
];

function inferTransactions(
  transactions: Array<{
    account: AccountLike;
    transaction: Transaction;
  }>,
  opts: Record<string, string>
): Transaction[] {
  return flatMap(transactions, ({ transaction }) => {
    invariant(
      transaction.family === "avalanchepchain",
      "avalanchepchain family"
    );

    return {
      ...transaction,
      family: "avalanchepchain",
      mode: opts.mode || "stake",
    } as Transaction;
  });
}

export default {
  options,
  inferTransactions,
};
