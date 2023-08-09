import { BigNumber } from "bignumber.js";
import { types as TyphonTypes, address as TyphonAddress } from "@stricahq/typhonjs";
import { defaultUpdateTransaction } from "@ledgerhq/coin-framework/bridge/jsHelpers";

import { CardanoAccount, Transaction } from "./types";
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
  poolId: undefined,
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
  let patch = {};
  try {
    const cardanoTransaction = await buildTransaction(a, t);
    const transactionFees = cardanoTransaction.getFee();
    const transactionAmount = t.subAccountId
      ? t.amount
      : cardanoTransaction
          .getOutputs()
          .filter(
            o =>
              !(o.address instanceof TyphonAddress.BaseAddress) ||
              !(o.address.paymentCredential.type === TyphonTypes.HashType.ADDRESS) ||
              o.address.paymentCredential.bipPath === undefined,
          )
          .reduce((total, o) => total.plus(o.amount), new BigNumber(0));

    patch = { fees: transactionFees, amount: transactionAmount };
  } catch (error) {
    patch = { fees: new BigNumber(0), amount: t.amount };
  }

  return defaultUpdateTransaction(t, patch);
};
