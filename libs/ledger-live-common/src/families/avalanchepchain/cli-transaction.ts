import invariant from "invariant";
import flatMap from "lodash/flatMap";
import { Transaction } from "./types";
import type { AccountLike } from "@ledgerhq/types-live";

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
      mode: opts.mode || "delegate",
    } as Transaction;
  });
}

export default {
  options,
  inferTransactions,
};
