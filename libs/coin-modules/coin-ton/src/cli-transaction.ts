import invariant from "invariant";
import flatMap from "lodash/flatMap";

import type { AccountLike } from "@ledgerhq/types-live";
import { Transaction } from "./types";

function inferTransactions(
  transactions: Array<{
    account: AccountLike;
    transaction: Transaction;
  }>,
  opts: Record<string, string>,
): Transaction[] {
  return flatMap(transactions, ({ transaction }) => {
    invariant(transaction.family === "ton", "ton family");

    return {
      ...transaction,
      family: "ton",
      mode: opts.mode || "send",
    } as Transaction;
  });
}

export default function makeCliTools() {
  return {
    options: [],
    inferTransactions,
  };
}
