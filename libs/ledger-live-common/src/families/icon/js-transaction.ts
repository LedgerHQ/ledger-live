import { BigNumber } from "bignumber.js";
import type { IconAccount, Transaction } from "./types";

import getEstimatedFees from "./js-getFeesForTransaction";

const sameFees = (a, b) => (!a || !b ? a === b : a.eq(b));

/**
 * Create an empty transaction
 *
 * @returns {Transaction}
 */
export const createTransaction = (): Transaction => ({
  family: "icon",
  mode: "send",
  amount: new BigNumber(0),
  recipient: "",
  useAllAmount: false,
  fees: null,
});

/**
 * Apply patch to transaction
 *
 * @param {*} t
 * @param {*} patch
 */
export const updateTransaction = (t: Transaction, patch: Transaction) => ({
  ...t,
  ...patch,
});

/**
 * Prepare transaction before checking status
 *
 * @param {IconAccount} a
 * @param {Transaction} t
 */
export const prepareTransaction = async (a: IconAccount, t: Transaction) => {
  let fees = t.fees;

  fees = await getEstimatedFees({ a, t });

  if (!sameFees(t.fees, fees)) {
    return { ...t, fees };
  }

  return t;
};
