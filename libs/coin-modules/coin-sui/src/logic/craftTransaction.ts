import BigNumber from "bignumber.js";
import type { TransactionIntent } from "@ledgerhq/coin-framework/api/index";
import type { SuiTransactionMode, CoreTransaction } from "../types";
import suiAPI from "../network";
import { SuiAsset } from "../api/types";
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
  coinType,
  type,
  ...extra
}: TransactionIntent<SuiAsset> & {
  coinType?: string;
  useAllAmount?: boolean;
  stakedSuiId?: string;
}): Promise<CoreTransaction> {
  const unsigned = await suiAPI.createTransaction(sender, {
    amount: BigNumber(amount.toString()),
    recipient,
    coinType: coinType ?? DEFAULT_COIN_TYPE,
    mode: type as SuiTransactionMode,
    ...extra,
  });

  return { unsigned };
}
