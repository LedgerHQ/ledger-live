import BigNumber from "bignumber.js";
import type { TransactionIntent } from "@ledgerhq/coin-framework/api/index";
import type { SuiTransactionMode, CoreTransaction } from "../types";
import suiAPI from "../network";
import { DEFAULT_COIN_TYPE } from "../network/sdk";
import { SuiAsset } from "../api/types";

export type CreateExtrinsicArg = {
  mode: SuiTransactionMode;
  amount: BigNumber;
  coinType: string;
  recipient: string;
  useAllAmount?: boolean | undefined;
};

export async function craftTransaction({
  sender,
  amount,
  recipient,
  type,
}: TransactionIntent<SuiAsset>): Promise<CoreTransaction> {
  const unsigned = await suiAPI.createTransaction(sender, {
    amount: BigNumber(amount.toString()),
    recipient,
    coinType: DEFAULT_COIN_TYPE,
    mode: type as SuiTransactionMode,
  });

  return { unsigned };
}
