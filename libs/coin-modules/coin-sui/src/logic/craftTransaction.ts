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
 * @param {number} _nonceToUse - The nonce to use for the transaction.
 * @param {CreateExtrinsicArg} extractExtrinsicArg - The arguments for creating the transaction, including mode, amount, recipient, and optional useAllAmount.
 * @param {boolean} [_forceLatestParams=false] - Whether to force the use of the latest parameters.
 * @returns {Promise<CoreTransaction>} A promise that resolves to the crafted CoreTransaction containing the unsigned transaction.
 */
export async function craftTransaction(
  address: string,
  _nonceToUse: number,
  extractExtrinsicArg: CreateExtrinsicArg,
  _forceLatestParams: boolean = false,
): Promise<CoreTransaction> {
  const unsigned = await suiAPI.createTransaction(address, extractExtrinsicArg);

  return {
    unsigned,
  };
}
