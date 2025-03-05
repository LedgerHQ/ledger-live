import { ACTIVATION_FEES, ACTIVATION_FEES_TRC_20 } from "./constants";
import type { Intent, Fees } from "@ledgerhq/coin-framework/api/index";

export async function estimateFees(intent: Intent): Promise<Fees> {
  const fees: Fees = {
    gross: BigInt(0),
  };
  if (intent.standard === "trc20") {
    fees.gross += BigInt(ACTIVATION_FEES_TRC_20.toString());
  } else {
    fees.gross += BigInt(ACTIVATION_FEES.toString());
  }
  return fees;
}
