import { BigNumber } from "bignumber.js";

import type { Account } from "../../types";
import type { Transaction } from "./types";

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
}: {
  a: Account;
  t: Transaction;
}): Promise<BigNumber> => {
  const unsigned = await buildTransaction(a, t);
  return unsigned.getFee();
};

export default getEstimatedFees;
