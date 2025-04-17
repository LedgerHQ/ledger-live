import suiAPI from "../network";
import { BigNumber } from "bignumber.js";
import type { TransactionIntent } from "@ledgerhq/coin-framework/api/index";

/**
 * Estimates the fees for a transaction
 *
 * @param {string} sender - The address of the sender for whom the fees are being estimated.
 * @param {Transaction} transaction - The transaction details for which the fees are to be estimated.
 * @returns {Promise<bigint>} A promise that resolves to the estimated fees in bigint format.
 */
export async function estimateFees({
  recipient,
  amount,
  sender,
}: TransactionIntent<void>): Promise<bigint> {
  const { gasBudget } = await suiAPI.paymentInfo(sender, {
    recipient,
    amount: BigNumber(amount.toString()),
  });
  return BigInt(gasBudget);
}
