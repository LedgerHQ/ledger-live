import type { AccountLike } from "@ledgerhq/types-live";
import invariant from "invariant";
import flatMap from "lodash/flatMap";
import type { Transaction } from "../../generated/types";
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
  opts: Record<string, any>,
  { inferAmount }: any
): Transaction[] {
  return flatMap(transactions, ({ transaction, account }) => {
    invariant(transaction.family === "ripple", "ripple family");
    return {
      ...transaction,
      fee: inferAmount(account, opts.fee || "0.001xrp"),
      tag: opts.tag,
    };
  });
}

export default {
  options,
  inferTransactions,
};
