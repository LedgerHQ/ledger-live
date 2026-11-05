import { BlockInfo } from "@ledgerhq/coin-module-framework/api/types";
import { type GetBlockByHeightSDK } from "./types";

export function toBlockInfo(blockInfoSDK: GetBlockByHeightSDK): BlockInfo {
  const block = blockInfoSDK.sdk_block ?? blockInfoSDK.block;
  return {
    height: parseInt(block.header.height, 10),
    hash: blockInfoSDK.block_id.hash,
    time: new Date(block.header.time),
  };
}
