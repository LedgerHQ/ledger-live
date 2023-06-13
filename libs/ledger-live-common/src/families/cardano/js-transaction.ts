import { BigNumber } from "bignumber.js";
import { CardanoAccount, Transaction } from "./types";
import { types as TyphonTypes, address as TyphonAddress } from "@stricahq/typhonjs";

import { buildTransaction } from "./js-buildTransaction";

/**
 * Create an empty transaction
 *
 * @returns {Transaction}
 */
export const createTransaction = (): Transaction => ({
  family: "cardano",
  mode: "send",
  amount: new BigNumber(0),
  recipient: "",
  useAllAmount: false,
  fees: new BigNumber(0),
});

/**
 * Apply patch to transaction
 *
 * @param {*} t
 * @param {*} patch
 */
export const updateTransaction = (t: Transaction, patch: Partial<Transaction>): Transaction => ({
  ...t,
  ...patch,
});

/**
 * Prepare transaction before checking status
 *
 * @param {Account} a
 * @param {Transaction} t
 */
export const prepareTransaction = async (
  a: CardanoAccount,
  t: Transaction,
): Promise<Transaction> => {
  let transaction;
  try {
    transaction = await buildTransaction(a, t);
  } catch (error) {
    return { ...t, fees: new BigNumber(0), amount: t.amount };
  }

  const transactionFees = transaction.getFee();
  const transactionAmount = t.subAccountId
    ? t.amount
    : transaction
        .getOutputs()
        .filter(
          o =>
            !(o.address instanceof TyphonAddress.BaseAddress) ||
            !(o.address.paymentCredential.type === TyphonTypes.HashType.ADDRESS) ||
            o.address.paymentCredential.bipPath === undefined,
        )
        .reduce((total, o) => total.plus(o.amount), new BigNumber(0));

  return { ...t, fees: transactionFees, amount: transactionAmount };
};
