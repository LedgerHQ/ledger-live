import { BigNumber } from "bignumber.js";
import type { Account } from "../../types";
import type { Transaction } from "./types";

import getEstimatedFees from "./js-getFeesForTransaction";

const sameFees = (a, b) => (!a || !b ? a === b : a.eq(b));

/**
 * Create an empty transaction
 *
 * @returns {Transaction}
 */
export const createTransaction = (): Transaction => ({
  family: "helium",
  amount: new BigNumber(0),
  recipient: "",
  useAllAmount: false,
  fees: new BigNumber(0),
  model: {
    mode: "send",
    memo: "",
  },
});

/**
 * Apply patch to transaction
 *
 * @param {*} t
 * @param {*} patch
 * @returns Transaction
 */
export const updateTransaction = (
  t: Transaction,
  patch: Partial<Transaction>
): Transaction => ({ ...t, ...patch });

/**
 * Prepare transaction before checking status
 *
 * @param {Account} a
 * @param {Transaction} t
 */
export const prepareTransaction = async (a: Account, t: Transaction) => {
  let fees = t.fees;

  fees = await getEstimatedFees({ a, t });

  if (!sameFees(t.fees, fees)) {
    return { ...t, fees };
  }

  return t;
};
