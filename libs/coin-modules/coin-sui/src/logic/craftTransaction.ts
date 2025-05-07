import BigNumber from "bignumber.js";
import type { CoreTransaction } from "../types";
import suiAPI from "../network";
import { type SuiTransactionIntent } from "../api/types";

export type CreateExtrinsicArg = {
  mode: string;
  amount: BigNumber;
  recipient: string;
  useAllAmount?: boolean | undefined;
};

export async function craftTransaction({
  sender,
  amount,
  recipient,
  type,
}: SuiTransactionIntent): Promise<CoreTransaction> {
  const unsigned = await suiAPI.createTransaction(sender.address, {
    amount: BigNumber(amount.toString()),
    recipient,
    mode: type,
  });

  return { unsigned };
}
