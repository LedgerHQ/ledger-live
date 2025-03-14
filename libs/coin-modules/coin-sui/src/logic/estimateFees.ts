import suiAPI from "../network";
import type { Transaction } from "../types";

/**
 * Estimates the fees for a transaction
 *
 * @param {string} sender - The address of the sender for whom the fees are being estimated.
 * @param {Transaction} transaction - The transaction details for which the fees are to be estimated.
 * @returns {Promise<bigint>} A promise that resolves to the estimated fees in bigint format.
 */
export async function estimateFees(sender: string, transaction: Transaction): Promise<bigint> {
  const { gasBudget } = await suiAPI.paymentInfo(sender, transaction);
  return BigInt(gasBudget);
}
