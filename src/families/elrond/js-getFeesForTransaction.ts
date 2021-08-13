import { BigNumber } from "bignumber.js";
import type { Account } from "../../types";
import type { Transaction } from "./types";
import { getFees } from "./api";
import { buildTransaction } from "./js-buildTransaction";

/**
 * Fetch the transaction fees for a transaction
 *
 * @param {Account} a
 * @param {Transaction} t
 */
const getEstimatedFees = async ({
  a,
  t,
  signUsingHash = true,
}: {
  a: Account;
  t: Transaction;
  signUsingHash: boolean | undefined;
}): Promise<BigNumber> => {
  const unsigned = await buildTransaction(a, t, signUsingHash);
  return await getFees(JSON.parse(unsigned));
};

export default getEstimatedFees;
