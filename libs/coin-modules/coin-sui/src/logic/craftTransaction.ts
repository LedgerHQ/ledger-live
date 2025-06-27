import BigNumber from "bignumber.js";
import type { TransactionIntent } from "@ledgerhq/coin-framework/api/index";
import type { SuiTransactionMode, CoreTransaction } from "../types";
import suiAPI from "../network";
import { DEFAULT_COIN_TYPE } from "../network/sdk";
import { SuiAsset } from "../api/types";

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
}: TransactionIntent<SuiAsset>): Promise<CoreTransaction> {
  const unsigned = await suiAPI.createTransaction(sender, {
    amount: BigNumber(amount.toString()),
    coinType: asset.type === "token" ? asset.coinType : DEFAULT_COIN_TYPE,
    mode: type as SuiTransactionMode,
    recipient,
  });

  return { unsigned };
}
