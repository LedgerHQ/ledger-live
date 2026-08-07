import type { BlockInfo } from "@ledgerhq/coin-module-framework/api/index";
import type { VechainContext } from "../../config";
import { getLastBlockHeight } from "../../network";
import { getBlockInfo } from "./getBlockInfo";

// Latest block; /blocks/best exposes only the height, so hash/time come from getBlockInfo.
export async function lastBlock(context: VechainContext): Promise<BlockInfo> {
  const config = await context.config();
  const height = await getLastBlockHeight(config);
  return getBlockInfo(context, height);
}
