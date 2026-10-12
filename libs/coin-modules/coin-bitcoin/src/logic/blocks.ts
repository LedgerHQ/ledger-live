import type { BlockInfo } from "@ledgerhq/coin-module-framework/api/types";
import type { Explorer } from "../network/explorer";

export async function lastBlock(explorer: Explorer): Promise<BlockInfo> {
  const block = await explorer.getCurrentBlock();
  return { height: block.height, hash: block.hash, time: new Date(block.time) };
}

export async function getBlockInfo(explorer: Explorer, height: number): Promise<BlockInfo> {
  const block = await explorer.getBlockByHeight(height);
  if (!block) throw new Error(`Block ${height} not found`);
  return { height: block.height, hash: block.hash, time: new Date(block.time) };
}
