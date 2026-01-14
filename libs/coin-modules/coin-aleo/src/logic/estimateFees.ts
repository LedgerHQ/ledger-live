import type { FeeEstimation } from "@ledgerhq/coin-framework/api/types";

export async function estimateFees(): Promise<FeeEstimation> {
  throw new Error("estimateFees is not supported");
}
