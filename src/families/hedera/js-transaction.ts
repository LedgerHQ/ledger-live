import BigNumber from "bignumber.js";
import type { Account } from "../../types";
import type { Transaction } from "./types";

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
  return { ...transaction, ...patch } as unknown as Transaction;
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
  return transaction;
}
