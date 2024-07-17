import type { AccountLike } from "@ledgerhq/types-live";
import invariant from "invariant";
import flatMap from "lodash/flatMap";
import type { IconAccount, Transaction } from "./types";

const options = [
  {
    name: "mode",
    type: String,
    desc: "mode of transaction: send, stake, unstake",
  },
];

function inferTransactions(
  transactions: Array<{
    account: AccountLike;
    transaction: Transaction;
  }>,
  opts: Record<string, any>,
): Transaction[] {
  return flatMap(transactions, ({ transaction, account }) => {
    invariant(
      transaction.family === "icon",
      "[cli-transaction] inferTransactions expects icon family transaction",
    );

    if (account.type === "Account") {
      invariant((account as IconAccount).iconResources, "unactivated account");
    }

    if (account.type === "TokenAccount") {
      const isDelisted = account.token.delisted === true;
      invariant(!isDelisted, "token is delisted");
    }

    return {
      ...transaction,
      family: "icon",
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
