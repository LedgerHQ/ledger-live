import type { BlockInfo } from "@ledgerhq/coin-module-framework/api/index";
import api from "../network";

/**
 * Returns lightweight metadata for a Substrate block at the given height.
 *
 * Fetches the block once via Sidecar `/blocks/{height}`. The `parentHash`
 * field in the Sidecar response provides parent data without a second request.
 *
 * Note: `time` is set to `new Date()` because Substrate block timestamps are
 * embedded inside `pallet_timestamp.now` extrinsics, not in the block header.
 * This is consistent with the existing `getLastBlock` behaviour.
 */
export async function getBlockInfo(height: number): Promise<BlockInfo> {
  if (!Number.isSafeInteger(height) || height <= 0) {
    throw new Error(`getBlockInfo: height must be a positive integer, got ${height}`);
  }

  const data = await api.getBlockByHeight(height);

  const info: BlockInfo = {
    height: parseInt(data.number),
    hash: data.hash,
    time: new Date(),
  };

  if (height > 1) {
    info.parent = { height: height - 1, hash: data.parentHash };
  }

  return info;
}
