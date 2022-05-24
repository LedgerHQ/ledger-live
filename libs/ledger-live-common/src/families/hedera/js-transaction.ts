import BigNumber from "bignumber.js";
import type { Account } from "../../types";
import type { Transaction } from "./types";
import { calculateAmount } from "./utils";

/**
 * Creates an empty transaction.
 *
 * @returns {Transaction}
 */
export function createTransaction(_account: Account): Transaction {
  return {
    family: "hedera",
    amount: new BigNumber(0),
    recipient: "",
    useAllAmount: false,
  };
}

/**
 * Update a base property of the transaction.
 *
 * @returns  {Transaction}
 */
export function updateTransaction(
  transaction: Transaction,
  patch: Partial<Transaction>
): Transaction {
  return { ...transaction, ...patch };
}

/**
 * Gather any more neccessary information for a transaction,
 * potentially from a network.
 *
 * Hedera has fully client-side transactions and the fee
 * is not possible to estimate ahead-of-time.
 *
 * @returns  {Transaction}
 */
export async function prepareTransaction(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  account: Account,
  transaction: Transaction
): Promise<Transaction> {
  // explicitly calculate transaction amount to account for `useAllAmount` flag (send max flow)
  // i.e. if `useAllAmount` has been toggled to true, this is where it will update the transaction to reflect that action
  const { amount } = await calculateAmount({ account, transaction });
  transaction.amount = amount;

  return transaction;
}
