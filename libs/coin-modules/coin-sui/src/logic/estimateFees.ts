import suiAPI from "../network";
import { BigNumber } from "bignumber.js";
import type { FeeEstimation } from "@ledgerhq/coin-framework/api/index";
import { SuiTransactionIntent } from "../api/types";

export async function estimateFees({
  recipient,
  amount,
  sender,
}: SuiTransactionIntent): Promise<FeeEstimation<Record<string, bigint>>> {
  const { gasBudget } = await suiAPI.paymentInfo(sender.address, {
    recipient,
    amount: BigNumber(amount.toString()),
  });
  return { value: BigInt(gasBudget) };
}
