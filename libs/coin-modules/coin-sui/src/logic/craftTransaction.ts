import type { TransactionIntent } from "@ledgerhq/coin-framework/api/index";
import BigNumber from "bignumber.js";
import suiAPI from "../network";
import { DEFAULT_COIN_TYPE } from "../network/sdk";
import type { SuiTransactionMode, CoreTransaction, Resolution } from "../types";

export async function craftTransaction(
  {
    amount,
    asset,
    recipient,
    sender,
    type,
    ...extra
  }: TransactionIntent & {
    useAllAmount?: boolean;
    stakedSuiId?: string;
  },
  withObjects: boolean = false,
  resolution?: Resolution,
): Promise<CoreTransaction> {
  let coinType = DEFAULT_COIN_TYPE;
  if (asset.type === "token" && asset.assetReference) {
    coinType = asset.assetReference;
  }
  return suiAPI.createTransaction(
    sender,
    {
      amount: BigNumber(amount.toString()),
      coinType,
      mode: type as SuiTransactionMode,
      recipient,
      ...extra,
    },
    withObjects,
    resolution,
  );
}
