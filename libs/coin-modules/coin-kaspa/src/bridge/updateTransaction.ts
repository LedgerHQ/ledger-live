import { Transaction } from "../types/bridge";

/**
 * Apply patch to transaction
 *
 * @param {*} t
 * @param {*} patch
 */
export const updateTransaction = (t: Transaction, patch: Partial<Transaction>) => ({
  ...t,
  ...patch,
});
