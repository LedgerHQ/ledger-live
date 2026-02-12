import invariant from "invariant";
import type { AccountLike } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import type { Transaction } from "../types";

const options = [
  {
    name: "fee",
    type: String,
    desc: "how much fee in CCD",
  },
  {
    name: "memo",
    type: String,
    desc: "transaction memo",
  },
];

function inferTransactions(
  transactions: Array<{
    account: AccountLike;
    transaction: Transaction;
  }>,
  opts: { memo?: string | null | undefined; fee?: string },
  {
    inferAmount,
  }: { inferAmount: (account: AccountLike, fee?: string) => BigNumber | null | undefined },
): Transaction[] {
  return transactions.flatMap(({ transaction, account }) => {
    invariant(transaction.family === "concordium", "Concordium family");
    return {
      ...transaction,
      fee: inferAmount(account, opts.fee || "0.01"),
      memo: opts.memo ?? undefined,
    };
  });
}

export default function makeCliTools() {
  return {
    options,
    inferTransactions,
  };
}
