import { BigNumber } from "bignumber.js";
import type { ElrondAccount, Transaction } from "./types";
import { getFees } from "./api";
import { buildTransaction } from "./js-buildTransaction";

/**
 * Fetch the transaction fees for a transaction
 *
 * @param {ElrondAccount} a
 * @param {Transaction} t
 */
const getEstimatedFees = async ({
  a,
  t,
}: {
  a: ElrondAccount;
  t: Transaction;
}): Promise<BigNumber> => {
  const unsigned = await buildTransaction(a, t);
  return await getFees(JSON.parse(unsigned));
};

export default getEstimatedFees;
