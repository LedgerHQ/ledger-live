import invariant from "invariant";
import flatMap from "lodash/flatMap";

import type { AccountLike } from "@ledgerhq/types-live";
import { Transaction } from "./types";

const options: any = [];

function inferTransactions(
  transactions: Array<{
    account: AccountLike;
    transaction: Transaction;
  }>,
  opts: Record<string, string>,
): Transaction[] {
  return flatMap(transactions, ({ transaction, account }) => {
    invariant(transaction.family === "ton", "ton family");

    if (account.type === "TokenAccount") {
      const isDelisted = account.token.delisted === true;
      invariant(!isDelisted, "token is delisted");
    }
    return {
      ...transaction,
      family: "ton",
      mode: opts.mode || "send",
      subAccountId: account.type === "TokenAccount" ? account.id : null,
    } as Transaction;
  });
}

export default function makeCliTools() {
  return {
    options,
    inferTransactions,
  };
}
