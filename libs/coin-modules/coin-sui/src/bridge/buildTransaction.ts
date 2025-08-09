import type { SuiAccount, Transaction } from "../types";
import { craftTransaction } from "../logic";
import { toSuiAsset } from "../network/sdk";

/**
 * @param {Account} account
 * @param {Transaction} transaction
 */
export const buildTransaction = async (
  account: SuiAccount,
  { recipient, mode, amount, coinType }: Transaction,
) => {
  return craftTransaction({
    sender: account.freshAddress,
    recipient,
    type: mode,
    amount: BigInt(amount.toString()),
    asset: toSuiAsset(coinType),
  });
};
