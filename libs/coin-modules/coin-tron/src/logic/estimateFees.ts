import { ACTIVATION_FEES, ACTIVATION_FEES_TRC_20 } from "./constants";
import type { TransactionIntent } from "@ledgerhq/coin-framework/api/index";

export async function estimateFees(transactionIntent: TransactionIntent): Promise<bigint> {
  let fees: bigint = BigInt(0);

  if (transactionIntent.standard === "trc20") {
    fees += BigInt(ACTIVATION_FEES_TRC_20.toString());
  } else {
    fees += BigInt(ACTIVATION_FEES.toString());
  }
  return fees;
}
