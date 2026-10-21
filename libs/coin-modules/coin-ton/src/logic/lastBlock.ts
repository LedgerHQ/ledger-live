import type { BlockInfo } from "@ledgerhq/coin-module-framework/api/index";
import type { TonContext } from "../config";
import { fetchMasterchainInfo } from "../network";
import { toBlockInfo } from "./getBlockInfo";

export async function lastBlock(context: TonContext): Promise<BlockInfo> {
  const { last } = await fetchMasterchainInfo(await context.config());
  return toBlockInfo(last);
}
