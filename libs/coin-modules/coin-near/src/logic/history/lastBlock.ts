import type { BlockInfo } from "@ledgerhq/coin-module-framework/api/index";
import { getLastBlockHeader } from "../../network";
import { toBlockInfo } from "./getBlockInfo";

/** Metadata of the latest final block. */
export async function lastBlock(): Promise<BlockInfo> {
  return toBlockInfo(await getLastBlockHeader());
}
