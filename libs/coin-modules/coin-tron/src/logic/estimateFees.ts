import { TronToken } from "../types";
import { ACTIVATION_FEES_TRC_20, STANDARD_FEES_NATIF } from "./constants";
import type { TransactionIntent } from "@ledgerhq/coin-framework/api/index";

export async function estimateFees(
  transactionIntent: TransactionIntent<TronToken>,
): Promise<bigint> {
  let fees: bigint = BigInt(0);

  if (transactionIntent.asset && transactionIntent.asset.standard === "trc20") {
    fees += BigInt(ACTIVATION_FEES_TRC_20.toString());
  } else {
    fees += BigInt(STANDARD_FEES_NATIF.toString());
  }
  return fees;
}
