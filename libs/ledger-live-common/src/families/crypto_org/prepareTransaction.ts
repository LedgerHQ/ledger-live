import type { Account } from "@ledgerhq/types-live";
import type { Transaction } from "./types";
import getEstimatedFees from "./getFeesForTransaction";

const sameFees = (a, b) => (!a || !b ? a === b : a.eq(b));

/**
 * Prepare transaction before checking status
 *
 * @param {Account} a
 * @param {Transaction} t
 */
export const prepareTransaction = async (a: Account, t: Transaction) => {
  let fees = t.fees;
  let memo = t.memo;

  fees = await getEstimatedFees();

  if (t.mode !== "send" && !memo) {
    memo = "Ledger Live";
  }

  if (t.memo !== memo || !sameFees(t.fees, fees)) {
    return { ...t, memo, fees };
  }

  return t;
};
