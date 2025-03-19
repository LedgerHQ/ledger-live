import { TronToken } from "../types";
import { ACTIVATION_FEES_TRC_20, STANDARD_FEES_NATIVE } from "./constants";
import type { TransactionIntent } from "@ledgerhq/coin-framework/api/index";

export async function estimateFees(
  transactionIntent: TransactionIntent<TronToken>,
): Promise<bigint> {
  if (transactionIntent.asset && transactionIntent.asset.standard === "trc20") {
    return BigInt(ACTIVATION_FEES_TRC_20.toString());
  } else {
    return BigInt(STANDARD_FEES_NATIVE.toString());
  }
}
