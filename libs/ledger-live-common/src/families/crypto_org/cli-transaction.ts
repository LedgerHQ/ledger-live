import invariant from "invariant";
import flatMap from "lodash/flatMap";
import type { Transaction, AccountLike } from "../../types";
const options = [
  {
    name: "mode",
    type: String,
    desc: "mode of transaction: send",
  },
  {
    name: "memo",
    type: String,
    desc: "add a memo to a transaction",
  },
];

function inferTransactions(
  transactions: Array<{
    account: AccountLike;
    transaction: Transaction;
  }>,
  opts: Record<string, any>
): Transaction[] {
  return flatMap(transactions, ({ transaction, account }) => {
    invariant(transaction.family === "crypto_org", "crypto_org family");
    if (transaction.family !== "crypto_org") {
      throw new Error("crypto_org family");
    }

    if (account.type === "Account") {
      invariant(account.cryptoOrgResources, "unactivated account");
      if (!account.cryptoOrgResources) throw new Error("unactivated account");
    }

    return {
      ...transaction,
      family: "crypto_org",
      mode: opts.mode || "send",
      memo: opts.memo,
    };
  });
}

export default {
  options,
  inferTransactions,
};
