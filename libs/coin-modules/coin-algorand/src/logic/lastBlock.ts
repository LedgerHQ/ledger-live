import { BlockInfo } from "@ledgerhq/coin-framework/api/types";
import { getTransactionParams, getBlock } from "../network";

/**
 * Get the last confirmed block info
 * @returns Block info with current round (height), hash, and time
 */
export async function lastBlock(): Promise<BlockInfo> {
  const params = await getTransactionParams();
  const blockData = await getBlock(params.lastRound);

  return {
    height: params.lastRound,
    hash: blockData.block.gh,
    time: new Date(blockData.block.ts * 1000),
  };
}
