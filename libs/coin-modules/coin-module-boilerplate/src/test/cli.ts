import invariant from "invariant";
import type { AccountLike } from "@ledgerhq/types-live";
import type { Transaction } from "../types";
import BigNumber from "bignumber.js";

const options = [
  {
    name: "fee",
    type: String,
    desc: "how much fee",
  },
  {
    name: "tag",
    type: Number,
    desc: "ripple tag",
  },
];

function inferTransactions(
  transactions: Array<{
    account: AccountLike;
    transaction: Transaction;
  }>,
  opts: { tag?: number | null | undefined; fee?: string },
  {
    inferAmount,
  }: { inferAmount: (account: AccountLike, fee?: string) => BigNumber | null | undefined },
): Transaction[] {
  return transactions.flatMap(({ transaction, account }) => {
    invariant(transaction.family === "boilerplate", "Boilerplate family");
    return {
      ...transaction,
      fee: inferAmount(account, opts.fee || "0.001brp"),
      tag: opts.tag,
    };
  });
}

export default function makeCliTools() {
  return {
    options,
    inferTransactions,
  };
}
