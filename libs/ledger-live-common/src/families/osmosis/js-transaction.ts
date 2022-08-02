import { BigNumber } from "bignumber.js";
import type { Account } from "@ledgerhq/types-live";
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
  sourceValidator: null,
  networkInfo: {
    family: "osmosis",
    fees: new BigNumber(0),
  },
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
): Transaction => {
  if ("mode" in patch && patch.mode !== t.mode) {
    return { ...t, ...patch, gas: null, fees: null };
  }
  if (
    "validators" in patch &&
    patch.validators?.length !== t.validators.length
  ) {
    return { ...t, ...patch, gas: null, fees: null };
  }
  return { ...t, ...patch };
};

/**
 * Prepare transaction before checking status
 *
 * @param {Account} a
 * @param {Transaction} t
 */
export const prepareTransaction = async (account: Account, t: Transaction) => {
  let { fees, memo, gas, amount } = t;
  const { mode } = t;

  fees = await getEstimatedFees(mode);
  gas = await getEstimatedGas(mode);

  if (mode === "send") {
    t.amount = t.useAllAmount
      ? await estimateMaxSpendable({ account, parentAccount: null, mode })
      : amount;
  }

  if (mode !== "send" && !memo) {
    memo = "Ledger Live";
  }

  if (t.useAllAmount) {
    amount = await estimateMaxSpendable({ account, parentAccount: null, mode });
    t = { ...t, amount, fees, gas };
  }

  if ((mode === "delegate" || mode === "claimRewardCompound") && amount.eq(0)) {
    const validatorAmount = t.validators.reduce(
      (old, current) => old.plus(current.amount),
      new BigNumber(0)
    );
    amount = validatorAmount;
    t = { ...t, amount, fees, gas };
  }

  if (t.memo !== memo || !sameFees(t.fees, fees)) {
    return { ...t, memo, fees, gas };
  }

  return t;
};
