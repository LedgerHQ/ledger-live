import invariant from "invariant";
import flatMap from "lodash/flatMap";

import { Transaction } from "./types";
import type { AccountLike } from "@ledgerhq/types-live";

const options: any = [];

function inferTransactions(
  transactions: Array<{
    account: AccountLike;
    transaction: Transaction;
  }>,
  opts: Record<string, string>,
): Transaction[] {
  return flatMap(transactions, ({ transaction }) => {
    invariant(transaction.family === "kadena", "kadena family");

    return {
      ...transaction,
      family: "kadena",
      mode: opts.mode || "send",
    } as Transaction;
  });
}

export default function makeCliTools() {
  return {
    options,
    inferTransactions,
  };
}
