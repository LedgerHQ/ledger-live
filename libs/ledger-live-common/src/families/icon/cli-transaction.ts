import flatMap from "lodash/flatMap";
import invariant from "invariant";
import type { Transaction } from "../../generated/types";
import type { IconAccount } from "./types";
import type { AccountLike } from "@ledgerhq/types-live";

const options = [
  {
    name: "mode",
    type: String,
    desc: "mode of transaction: send",
  },
];

function inferTransactions(
  transactions: Array<{ account: AccountLike; transaction: Transaction }>,
  opts: any
): Transaction[] {
  return flatMap(transactions, ({ transaction, account }) => {
    invariant(transaction.family === "icon", "icon family");

    if (account.type === "Account") {
      invariant((account as IconAccount).iconResources, "unactivated account");
    }

    return {
      ...transaction,
      family: "icon",
      mode: opts.mode || "send",
    };
  });
}

export default {
  options,
  inferTransactions,
};
