import BigNumber from "bignumber.js";
import type { TransactionIntent } from "@ledgerhq/coin-framework/api/index";
import type { SuiTransactionMode, CoreTransaction } from "../types";
import suiAPI from "../network";
import { SuiAsset } from "../api/types";
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
}: TransactionIntent<SuiAsset> & { coinType?: string }): Promise<CoreTransaction> {
  const unsigned = await suiAPI.createTransaction(sender, {
    amount: BigNumber(amount.toString()),
    recipient,
    coinType: asset.type === "token" ? asset.coinType : DEFAULT_COIN_TYPE,
    mode: type as SuiTransactionMode,
  });

  return { unsigned };
}
