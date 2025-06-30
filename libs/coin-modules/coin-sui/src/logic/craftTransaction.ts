import BigNumber from "bignumber.js";
import type { CoreTransaction } from "../types";
import type { TransactionIntent } from "@ledgerhq/coin-framework/api/index";
import suiAPI from "../network";
import { SuiAsset } from "../api/types";

export type CreateExtrinsicArg = {
  mode: string;
  amount: BigNumber;
  recipient: string;
  useAllAmount?: boolean;
  stakedSuiId?: string;
  fees?: BigNumber | null;
};

export async function craftTransaction({
  sender,
  amount,
  recipient,
  type,
  ...extra
}: TransactionIntent<SuiAsset> & {
  useAllAmount?: boolean;
  stakedSuiId?: string;
}): Promise<CoreTransaction> {
  const unsigned = await suiAPI.createTransaction(sender, {
    amount: BigNumber(amount.toString()),
    recipient,
    mode: type,
    ...extra,
  });

  return { unsigned };
}
