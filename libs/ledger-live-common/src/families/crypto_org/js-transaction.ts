import { BigNumber } from "bignumber.js";
import type { Account } from "@ledgerhq/types-live";
import type { Transaction } from "./types";
import getEstimatedFees from "./js-getFeesForTransaction";

const sameFees = (a, b) => (!a || !b ? a === b : a.eq(b));

/**
 * Create an empty transaction
 *
 * @returns {Transaction}
 */
export const createTransaction = (): Transaction => ({
  family: "crypto_org",
  mode: "send",
  amount: new BigNumber(0),
  recipient: "",
  useAllAmount: false,
  fees: new BigNumber(0),
  memo: null,
});

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
