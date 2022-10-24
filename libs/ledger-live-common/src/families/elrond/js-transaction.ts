import { $Shape } from "utility-types";
import { BigNumber } from "bignumber.js";
import type { ElrondAccount, Transaction } from "./types";
import getEstimatedFees from "./js-getFeesForTransaction";
import { MIN_GAS_LIMIT } from "./constants";

const sameFees = (a, b) => (!a || !b ? false : a === b);

/**
 * Create an empty transaction
 *
 * @returns {Transaction}
 */
export const createTransaction = (): Transaction => {
  return {
    family: "elrond",
    mode: "send",
    amount: new BigNumber(0),
    recipient: "",
    useAllAmount: false,
    fees: new BigNumber(50000),
    gasLimit: MIN_GAS_LIMIT,
  };
};

/**
 * Apply patch to transaction
 *
 * @param {*} t
 * @param {*} patch
 */
export const updateTransaction = (
  t: Transaction,
  patch: $Shape<Transaction>
): Transaction => {
  return { ...t, ...patch };
};

/**
 * Prepare transaction before checking status
 *
 * @param {ElrondAccount} a
 * @param {Transaction} t
 */
export const prepareTransaction = async (
  a: ElrondAccount,
  t: Transaction
): Promise<Transaction> => {
  let fees = t.fees;
  fees = await getEstimatedFees(t);

  if (!sameFees(t.fees, fees)) {
    return { ...t, fees };
  }

  return t;
};
