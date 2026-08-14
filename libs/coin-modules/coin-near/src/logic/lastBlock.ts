import type { BlockInfo } from "@ledgerhq/coin-module-framework/api/index";
import type { NearContext } from "../config";
import { getLastBlockHeader } from "../network";
import { toBlockInfo } from "./getBlockInfo";

/** Metadata of the latest final block. */
export async function lastBlock(context: NearContext): Promise<BlockInfo> {
  const config = await context.config();
  return toBlockInfo(await getLastBlockHeader(config));
}
