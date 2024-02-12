import invariant from "invariant";
import { BigNumber } from "bignumber.js";
import type { Transaction } from "../../generated/types";
import { bitcoinPickingStrategy } from "./types";
import type { AccountLike } from "@ledgerhq/types-live";
const options = [
  {
    name: "feePerByte",
    type: String,
    desc: "how much fee per byte",
  },
  {
    name: "excludeUTXO",
    alias: "E",
    type: String,
    multiple: true,
    desc: "exclude utxo by their txhash@index (example: -E hash@3 -E hash@0)",
  },
  {
    name: "rbf",
    type: Boolean,
    desc: "enable replace-by-fee",
  },
  {
    name: "bitcoin-pick-strategy",
    type: String,
    desc: "utxo picking strategy, one of: " + Object.keys(bitcoinPickingStrategy).join(" | "),
  },
];

function inferTransactions(
  transactions: Array<{
    account: AccountLike;
    transaction: Transaction;
  }>,
  opts: Record<string, any>,
): Transaction[] {
  const feePerByte = new BigNumber(opts.feePerByte === undefined ? 1 : opts.feePerByte);
  return transactions.map(({ transaction }) => {
    invariant(transaction.family === "bitcoin", "bitcoin family");
    return {
      ...transaction,
      feePerByte,
      rbf: opts.rbf || false,
      utxoStrategy: {
        strategy: bitcoinPickingStrategy[opts["bitcoin-pick-strategy"]] || 0,
        excludeUTXOs: (opts.excludeUTXO || []).map(str => {
          const [hash, index] = str.split("@");
          invariant(hash && index && !isNaN(index), "invalid format for --excludeUTXO, -E");
          return {
            hash,
            outputIndex: parseInt(index, 10),
          };
        }),
      },
    };
  });
}

export default {
  options,
  inferTransactions,
};
