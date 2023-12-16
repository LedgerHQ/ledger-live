import { BigNumber } from "bignumber.js";
import type { IconAccount, Transaction } from "./types";
import { getFees } from "./api/node";
import { buildTransaction } from "./js-buildTransaction";
import { getStepPrice } from "./api/node";

/**
 * Fetch the transaction fees for a transaction
 *
 * @param {Account} a
 * @param {Transaction} t
 */
const getEstimatedFees = async ({
  a,
  t,
}: {
  a: IconAccount;
  t: Transaction;
}): Promise<BigNumber> => {
  const unsigned = await buildTransaction(a, t);
  if (unsigned?.rawTransaction?.to) {
    const stepLimit = await getFees(unsigned.rawTransaction, a);
    t.stepLimit = stepLimit;
    const stepPrice = await getStepPrice(a);
    return stepLimit.multipliedBy(stepPrice);
  }
  return new BigNumber(0);
};

export default getEstimatedFees;
