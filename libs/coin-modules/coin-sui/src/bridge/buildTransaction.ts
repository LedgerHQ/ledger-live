import pick from "lodash/pick";
import type { SuiAccount, Transaction } from "../types";
import { craftTransaction, type CreateExtrinsicArg } from "../logic";
import { AssetInfo } from "@ledgerhq/coin-framework/api/types";

export const extractExtrinsicArg = (transaction: Transaction): CreateExtrinsicArg =>
  pick(transaction, ["mode", "amount", "recipient", "useAllAmount", "coinType"]);

/**
 * @param {Account} account
 * @param {Transaction} transaction
 */
export const buildTransaction = async (
  { freshAddress }: SuiAccount,
  { recipient, mode, amount, coinType }: Transaction,
) => {
  const NATIVE_COIN_TYPE = "0x2::sui::SUI"; // <-- NOTE: unusure, double check
  let asset: AssetInfo = {
    type: "native",
  };
  if (coinType !== NATIVE_COIN_TYPE) {
    asset = {
      type: "token",
      assetReference: coinType,
    };
  }
  return craftTransaction({
    sender: freshAddress,
    recipient,
    type: mode,
    amount: BigInt(amount.toString()),
    asset,
  });
};
