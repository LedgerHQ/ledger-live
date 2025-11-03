import type { BlockInfo } from "@ledgerhq/coin-framework/lib-es/api/types";
import { SYNTHETIC_BLOCK_WINDOW_SECONDS } from "../constants";
import { getBlockHash } from "./utils";

/**
 * Retrieves synthetic block information based on the provided block height.
 *
 * @param blockHeight - The height of the block for which to retrieve information.
 * @param blockWindowSeconds - The duration in seconds that defines the synthetic block window (default is SYNTHETIC_BLOCK_WINDOW_SECONDS).
 * @returns An object containing the block height, block hash, and block time.
 */
export const getBlockInfo = async (
  blockHeight: number,
  blockWindowSeconds = SYNTHETIC_BLOCK_WINDOW_SECONDS,
): Promise<BlockInfo> => {
  const seconds = blockHeight * blockWindowSeconds;
  const hash = getBlockHash(blockHeight);
  const time = new Date(seconds * 1000);

  return {
    height: blockHeight,
    hash,
    time,
  };
};
