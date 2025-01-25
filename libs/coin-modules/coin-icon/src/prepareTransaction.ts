import type { IconAccount, Transaction } from "./types";
import getEstimatedFees from "./getFeesForTransaction";
import BigNumber from "bignumber.js";

const sameFees = (a: BigNumber, b?: BigNumber | null) => (!a || !b ? a === b : a.eq(b));

/**
 * Prepare transaction before checking status
 *
 * @param {IconAccount} account
 * @param {Transaction} transaction
 */
export const prepareTransaction = async (
  account: IconAccount,
  transaction: Transaction,
): Promise<Transaction> => {
  let fees = transaction.fees;
  fees = await getEstimatedFees({ account, transaction });

  if (fees && !sameFees(fees, transaction.fees)) {
    return { ...transaction, fees };
  }
  return transaction;
};
