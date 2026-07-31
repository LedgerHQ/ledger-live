import type { BlockInfo } from "@ledgerhq/coin-module-framework/api/index";
import { getLastBlockHeight } from "../../network";
import { getBlockInfo } from "./getBlockInfo";

// Latest block; /blocks/best exposes only the height, so hash/time come from getBlockInfo.
export async function lastBlock(): Promise<BlockInfo> {
  const height = await getLastBlockHeight();
  return getBlockInfo(height);
}
