import { BigNumber } from "bignumber.js";
import { Account } from "@ledgerhq/types-live";

import type { NervosAccount, Transaction } from "./types";

import { buildTransaction } from "./js-buildTransaction";

/**
 * Fetch the transaction fees for a transaction
 *
 * @param {Account} a
 * @param {Transaction} t
 */
export const getEstimatedFees = async ({
  a,
  t,
}: {
  a: Account;
  t: Transaction;
}): Promise<BigNumber> => {
  const { status } = await buildTransaction(a as NervosAccount, t);
  return status.estimatedFees;
};
