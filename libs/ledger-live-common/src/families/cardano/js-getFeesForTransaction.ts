import { BigNumber } from "bignumber.js";
import type { CardanoAccount, Transaction } from "./types";
import { buildTransaction } from "./js-buildTransaction";

/**
 * Fetch the transaction fees for a transaction
 *
 * @param {CardanoAccount} a
 * @param {Transaction} t
 */
const getEstimatedFees = async ({
  a,
  t,
}: {
  a: CardanoAccount;
  t: Transaction;
}): Promise<BigNumber> => {
  const unsigned = await buildTransaction(a, t);
  return unsigned.getFee();
};

export default getEstimatedFees;
