import type { BlockInfo } from "@ledgerhq/coin-module-framework/api/index";
import { getBlocksFromBlueScore } from "../network";
import { pickChainBlock, toBlockInfo } from "./blockInfo";

/**
 * Block metadata at a given virtual-chain blue score. Kaspa is a BlockDAG: `height` here is the
 * virtual-chain blue score, and a single blue score can map to more than one block — so we pick
 * the selected-chain block (see `pickChainBlock`).
 */
export async function getBlockInfo(height: number): Promise<BlockInfo> {
  const blocks = await getBlocksFromBlueScore(height);
  return toBlockInfo(pickChainBlock(blocks, height), height);
}
