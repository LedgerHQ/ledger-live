import flatMap from "lodash/flatMap";
import invariant from "invariant";
import type { Transaction } from "../../generated/types";
import type { IconAccount, Vote } from "./types";
import type { AccountLike } from "@ledgerhq/types-live";
import { zipWith } from "lodash";
import BigNumber from "bignumber.js";

const options = [
  {
    name: "mode",
    type: String,
    desc: "mode of transaction: send",
  },
];

function inferTransactions(
  transactions: Array<{
    account: AccountLike;
    transaction: Transaction;
  }>,
  opts: Record<string, any>
): Transaction[] {
  const mode = opts.mode || "send";
  invariant(
    ["send", "freeze", "unfreeze", "vote", "claimReward"].includes(mode),
    `Unexpected mode: ${mode}`
  );

  const voteAddresses: string[] = opts["iconVoteAddress"] || [];
  const voteCounts: BigNumber[] = (opts["iconVoteValue"] || []).map((value) => {
    invariant(new  BigNumber(value), `Invalid number: ${value}`);
    return new BigNumber(value);
  });

  const votes: Vote[] = zipWith(voteAddresses, voteCounts, (a, v) => ({
    address: a,
    value: v,
  }));
  return flatMap(transactions, ({ transaction, account }) => {
    invariant(transaction.family === "icon", "icon family");

    if (account.type === "Account") {
      invariant((account as IconAccount).iconResources, "unactivated account");
    }

    return {
      ...transaction,
      family: "icon",
      mode: opts.mode || "send",
      votes,
    };
  });
}

export default {
  options,
  inferTransactions,
};
