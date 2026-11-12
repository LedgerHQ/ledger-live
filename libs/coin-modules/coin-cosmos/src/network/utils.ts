import { BlockInfo } from "@ledgerhq/coin-module-framework/api/types";
import { type GetBlockByHeightSDK } from "./types";

/** `sdk_block` is returned since cosmos-sdk 0.47; the deprecated `block` is the fallback for older SDKs. */
export function toBlockInfo(blockInfoSDK: GetBlockByHeightSDK): BlockInfo {
  const block = blockInfoSDK.sdk_block ?? blockInfoSDK.block;
  return {
    height: Number.parseInt(block.header.height, 10),
    hash: blockInfoSDK.block_id.hash,
    time: new Date(block.header.time),
  };
}
