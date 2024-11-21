import flatMap from "lodash/flatMap";
import type { AccountLike } from "@ledgerhq/types-live";
import { KaspaTransaction } from "../types/bridge";

const options = [
  {
    name: "mode",
    type: String,
    desc: "mode of transaction: send",
  },
  // {
  //   name: "rbf",
  //   type: Boolean,
  //   desc: "enable replace-by-fee",
  // },
];

function inferTransactions(
  transactions: Array<{ account: AccountLike; transaction: KaspaTransaction }>,
  opts: Record<string, any>,
): KaspaTransaction[] {
  return flatMap(transactions, ({ transaction, account }) => {
    if (transaction.family !== "kaspa") {
      throw new Error("transaction is not of type Kaspa");
    }

    return {
      ...transaction,
      family: "kaspa",
      mode: opts.mode || "send",
    };
  });
}

export default {
  options,
  inferTransactions,
};
