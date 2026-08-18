import type { TransactionIntent } from "@ledgerhq/coin-module-framework/api/index";
import BigNumber from "bignumber.js";
import suiAPI from "../network";
import { DEFAULT_COIN_TYPE } from "../network/sdk";
import type { SuiCoinConfig } from "../config";
import type { SuiTransactionMode, CoreTransaction, Resolution } from "../types";

export async function craftTransaction(
  config: SuiCoinConfig,
  {
    amount,
    asset,
    recipient,
    sender,
    type,
    currencyId: _currencyId,
    ...extra
  }: TransactionIntent & {
    useAllAmount?: boolean;
    stakedSuiId?: string;
    currencyId?: string;
  },
  withObjects: boolean = false,
  resolution?: Resolution,
): Promise<CoreTransaction> {
  let coinType = DEFAULT_COIN_TYPE;
  if (asset.type === "token" && asset.assetReference) {
    coinType = asset.assetReference;
  }
  return suiAPI.createTransaction(
    config,
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
