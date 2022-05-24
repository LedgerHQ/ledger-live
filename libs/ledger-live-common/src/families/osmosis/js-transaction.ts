import { BigNumber } from "bignumber.js";
import type { Account } from "../../types";
import type { Transaction } from "./types";

import getEstimatedFees, { getEstimatedGas } from "./js-getFeesForTransaction";
import estimateMaxSpendable from "./js-estimateMaxSpendable";
import { CosmosDelegationInfo } from "../cosmos/types";

const sameFees = (a, b) => (!a || !b ? a === b : a.eq(b));

/**
 * Create an empty transaction
 *
 * @returns {Transaction}
 */
export const createTransaction = (): Transaction => ({
  family: "osmosis",
  mode: "send",
  amount: new BigNumber(0),
  recipient: "",
  useAllAmount: false,
  fees: null,
  gas: null,
  memo: null,
  validators: [] as CosmosDelegationInfo[],
});

/**
 * Apply patch to transaction
 *
 * @param {*} t
 * @param {*} patch
 */
export const updateTransaction = (
  t: Transaction,
  patch: Partial<Transaction>
) => ({ ...t, ...patch });

/**
 * Prepare transaction before checking status
 *
 * @param {Account} a
 * @param {Transaction} t
 */
export const prepareTransaction = async (account: Account, t: Transaction) => {
  let fees = t.fees;
  let memo = t.memo;
  let gas = t.gas;

  fees = await getEstimatedFees();

  if (t.mode === "send") {
    t.amount = t.useAllAmount
      ? await estimateMaxSpendable({ account, parentAccount: null })
      : t.amount;

    gas = await getEstimatedGas();
  }

  if (t.mode !== "send" && !memo) {
    memo = "Ledger Live";
  }

  if (t.memo !== memo || !sameFees(t.fees, fees)) {
    return { ...t, memo, fees, gas };
  }

  return t;
};
