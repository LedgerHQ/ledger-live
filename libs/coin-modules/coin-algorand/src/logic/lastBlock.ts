import { BlockInfo } from "@ledgerhq/coin-framework/api/types";
import { getTransactionParams } from "../network";

/**
 * Get the last confirmed block info
 * @returns Block info with current round (height)
 */
export async function lastBlock(): Promise<BlockInfo> {
  const params = await getTransactionParams();

  return {
    height: params.lastRound,
  };
}
