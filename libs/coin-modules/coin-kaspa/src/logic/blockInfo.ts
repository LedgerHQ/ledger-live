import type { BlockInfo } from "@ledgerhq/coin-module-framework/api/index";
import type { ApiResponseBlockInfo } from "../types";

/**
 * Pure helpers shared by `getBlockInfo`, `lastBlock`, and `getBlock` so each stays a
 * self-contained logic→network function (no logic→logic coupling) without duplicating the
 * BlockDAG block-selection and mapping logic.
 */

/**
 * Select the block for a blue score. A blue score can map to several blocks in the DAG — exactly
 * one is on the selected chain (`isChainBlock`), which is the canonical, deterministic choice.
 */
export function pickChainBlock(
  blocks: ApiResponseBlockInfo[],
  height: number,
): ApiResponseBlockInfo {
  if (!Array.isArray(blocks) || blocks.length === 0) {
    throw new Error(`kaspa: no block at blueScore ${height}`);
  }
  return blocks.find(b => b.verboseData.isChainBlock) ?? blocks[0];
}

/** Map a selected-chain block to the framework `BlockInfo`. `height` is the requested blue score. */
export function toBlockInfo(block: ApiResponseBlockInfo, height: number): BlockInfo {
  return {
    height,
    hash: block.verboseData.hash,
    time: new Date(Number(block.header.timestamp)), // header.timestamp is unix ms, as a string
  };
}
