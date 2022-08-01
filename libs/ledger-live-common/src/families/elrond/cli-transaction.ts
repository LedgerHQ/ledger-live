import type { AccountLike } from "@ledgerhq/types-live";
import invariant from "invariant";
import flatMap from "lodash/flatMap";
import type { Transaction } from "../../generated/types";
import type { ElrondAccount } from "./types";
const options = [
  {
    name: "mode",
    type: String,
    desc: "mode of transaction: send, delegate, unDelegate, claimRewards",
  },
];

function inferTransactions(
  transactions: Array<{
    account: AccountLike;
    transaction: Transaction;
  }>,
  _opts: Record<string, any>
): Transaction[] {
  return flatMap(transactions, ({ transaction, account }) => {
    invariant(transaction.family === "elrond", "elrond family");

    if (account.type === "Account") {
      invariant(
        (account as ElrondAccount).elrondResources,
        "unactivated account"
      );
    }

    transaction.family = "elrond";

    return {
      ...transaction,
      mode: _opts.mode || "send",
    };
  });
}

export default {
  options,
  inferTransactions,
};
