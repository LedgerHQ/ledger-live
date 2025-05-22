import suiAPI from "../network";
import { BigNumber } from "bignumber.js";
import type { TransactionIntent } from "@ledgerhq/coin-framework/api/index";
import { SuiAsset } from "../api/types";

export async function estimateFees({
  recipient,
  amount,
  sender,
}: TransactionIntent<SuiAsset>): Promise<bigint> {
  const { gasBudget } = await suiAPI.paymentInfo(sender, {
    recipient,
    amount: BigNumber(amount.toString()),
  });
  return BigInt(gasBudget);
}
