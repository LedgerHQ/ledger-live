import BigNumber from "bignumber.js";
import type { SuiTransactionMode, CoreTransaction } from "../types";
import suiAPI from "../network";

export type CreateExtrinsicArg = {
  mode: SuiTransactionMode;
  amount: BigNumber;
  coinType: string;
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
