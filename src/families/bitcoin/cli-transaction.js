// @flow

import invariant from "invariant";
import { BigNumber } from "bignumber.js";
import type { Transaction, AccountLike } from "../../types";

const options = [
  {
    name: "feePerByte",
    type: String,
    desc: "how much fee per byte",
  },
];

function inferTransactions(
  transactions: Array<{ account: AccountLike, transaction: Transaction }>,
  opts: Object
): Transaction[] {
  const feePerByte = new BigNumber(
    opts.feePerByte === undefined ? 1 : opts.feePerByte
  );
  return transactions.map(({ transaction }) => {
    invariant(transaction.family === "bitcoin", "bitcoin family");
    return {
      ...transaction,
      feePerByte,
    };
  });
}

export default {
  options,
  inferTransactions,
};
