import type { IconAccount, Transaction } from "./types";
import getEstimatedFees from "./js-getFeesForTransaction";
import BigNumber from "bignumber.js";

const sameFees = (a: BigNumber, b?: BigNumber | null) => (!a || !b ? a === b : a.eq(b));

/**
 * Prepare transaction before checking status
 *
 * @param {IconAccount} a
 * @param {Transaction} t
 */
export const prepareTransaction = async (a: IconAccount, t: Transaction): Promise<Transaction> => {
  let fees = t.fees;
  fees = await getEstimatedFees({ a, t });

  if (fees && !sameFees(fees, t.fees)) {
    return { ...t, fees };
  }
  return t;
};
