import { TronAsset } from "../types";
import { ACTIVATION_FEES_TRC_20, STANDARD_FEES_NATIVE } from "./constants";
import type { TransactionIntent } from "@ledgerhq/coin-framework/api/index";

export async function estimateFees(
  transactionIntent: TransactionIntent<TronAsset>,
): Promise<bigint> {
  if (transactionIntent.asset.type === "token" && transactionIntent.asset.standard === "trc20") {
    return BigInt(ACTIVATION_FEES_TRC_20.toString());
  } else {
    return BigInt(STANDARD_FEES_NATIVE.toString());
  }
}
