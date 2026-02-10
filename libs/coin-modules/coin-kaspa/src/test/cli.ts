import type { AccountLike } from "@ledgerhq/types-live";
import flatMap from "lodash/flatMap";
import { Transaction } from "../types/bridge";

const options = [
  {
    name: "mode",
    type: String,
    desc: "mode of transaction: send",
  },
];

function inferTransactions(
  transactions: Array<{ account: AccountLike; transaction: Transaction }>,
  opts: Record<string, any>,
): Transaction[] {
  return flatMap(transactions, ({ transaction }) => {
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
