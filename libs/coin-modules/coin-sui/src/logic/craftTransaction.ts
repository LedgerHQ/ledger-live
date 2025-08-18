import BigNumber from "bignumber.js";
import type { TransactionIntent } from "@ledgerhq/coin-framework/api/index";
import type { SuiTransactionMode, CoreTransaction } from "../types";
import suiAPI from "../network";
import { DEFAULT_COIN_TYPE } from "../network/sdk";

export type CreateExtrinsicArg = {
  amount: BigNumber;
  coinType: string;
  mode: SuiTransactionMode;
  recipient: string;
  useAllAmount?: boolean | undefined;
};

export async function craftTransaction({
  amount,
  asset,
  recipient,
  sender,
  type,
}: TransactionIntent): Promise<CoreTransaction> {
  let coinType = DEFAULT_COIN_TYPE;
  if (asset.type === "token" && asset.assetReference) {
    coinType = asset.assetReference;
  }
  const unsigned = await suiAPI.createTransaction(sender, {
    amount: BigNumber(amount.toString()),
    coinType,
    mode: type as SuiTransactionMode,
    recipient,
  });

  return { unsigned };
}
