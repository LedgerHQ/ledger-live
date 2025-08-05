import BigNumber from "bignumber.js";
import type { TransactionIntent } from "@ledgerhq/coin-framework/api/index";
import type { SuiTransactionMode, CoreTransaction } from "../types";
import suiAPI from "../network";
import { DEFAULT_COIN_TYPE } from "../network/sdk";

export type CreateExtrinsicArg = {
  mode: SuiTransactionMode;
  amount: BigNumber;
  coinType: string;
  recipient: string;
  useAllAmount?: boolean;
  stakedSuiId?: string;
  fees?: BigNumber | null;
};

export async function craftTransaction({
  sender,
  amount,
  recipient,
  asset,
  type,
  ...extra
}: TransactionIntent & {
  useAllAmount?: boolean;
  stakedSuiId?: string;
}): Promise<CoreTransaction> {
  let coinType = DEFAULT_COIN_TYPE;
  if (asset.type === "token" && asset.assetReference) {
    coinType = asset.assetReference;
  }
  const unsigned = await suiAPI.createTransaction(sender, {
    amount: BigNumber(amount.toString()),
    recipient,
    coinType,
    mode: type as SuiTransactionMode,
    ...extra,
  });

  return { unsigned };
}
