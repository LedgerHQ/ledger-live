import type { BlockInfo } from "@ledgerhq/coin-module-framework/api/index";
import type { NearContext } from "../config";
import { getBlockHeaderAtHeight } from "../network";
import type { NearBlockHeader } from "../network/sdk.types";

/** NEAR block timestamps are nanoseconds since the epoch. */
export const toBlockInfo = (header: NearBlockHeader): BlockInfo => ({
  height: header.height,
  hash: header.hash,
  time: new Date(header.timestamp / 1e6),
});

/** Block metadata at a given height, via the JSON-RPC `block` method. */
export async function getBlockInfo(context: NearContext, height: number): Promise<BlockInfo> {
  const config = await context.config();
  return toBlockInfo(await getBlockHeaderAtHeight(config, height));
}
