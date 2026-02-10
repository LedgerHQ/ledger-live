import type { TransactionIntent } from "@ledgerhq/coin-framework/api/index";
import { TronMemo } from "../types";
import { ACTIVATION_FEES_TRC_20, STANDARD_FEES_NATIVE } from "./constants";

export async function estimateFees(
  transactionIntent: TransactionIntent<TronMemo>,
): Promise<bigint> {
  if (transactionIntent.asset.type === "trc20") {
    return BigInt(ACTIVATION_FEES_TRC_20.toString());
  } else {
    return BigInt(STANDARD_FEES_NATIVE.toString());
  }
}
