import type { BlockInfo } from "@ledgerhq/coin-module-framework/api/index";
import { getBlockHeaderAtHeight } from "../../network";
import type { NearBlockHeader } from "../../network/sdk.types";

/** NEAR block timestamps are nanoseconds since the epoch. */
export const toBlockInfo = (header: NearBlockHeader): BlockInfo => ({
  height: header.height,
  hash: header.hash,
  time: new Date(header.timestamp / 1e6),
});

/** Block metadata at a given height, via the JSON-RPC `block` method. */
export async function getBlockInfo(height: number): Promise<BlockInfo> {
  return toBlockInfo(await getBlockHeaderAtHeight(height));
}
