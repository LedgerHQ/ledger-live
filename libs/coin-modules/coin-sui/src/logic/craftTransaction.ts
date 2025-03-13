import BigNumber from "bignumber.js";
import type { CoreTransaction } from "../types";
import suiAPI from "../network";

export type CreateExtrinsicArg = {
  mode: string;
  amount: BigNumber;
  recipient: string;
  useAllAmount?: boolean | undefined;
};

/**
 * Crafts a transaction
 *
 * @param {string} address - The address of the sender.
 * @param {CreateExtrinsicArg} extractExtrinsicArg - The arguments for creating the transaction, including mode, amount, recipient, and optional useAllAmount.
 * @returns {Promise<CoreTransaction>} A promise that resolves to the crafted CoreTransaction containing the unsigned transaction.
 */
export async function craftTransaction(
  address: string,
  extractExtrinsicArg: CreateExtrinsicArg,
): Promise<CoreTransaction> {
  const unsigned = await suiAPI.createTransaction(address, extractExtrinsicArg);

  return {
    unsigned,
  };
}
