import { KaspaTransaction } from "../types/bridge";

/**
 * Apply patch to transaction
 *
 * @param {*} t
 * @param {*} patch
 */
export const updateTransaction = (
  t: KaspaTransaction,
  patch: $Shape<KaspaTransaction>
) => ({ ...t, ...patch });