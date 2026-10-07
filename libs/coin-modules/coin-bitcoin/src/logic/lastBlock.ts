import type { BlockInfo } from "@ledgerhq/coin-module-framework/api/types";
import type { BitcoinContext } from "../config";
import { fetchCurrentBlock } from "../network/explorer";
import { toBlockInfo } from "./getBlockInfo";

/** The explorer's current chain tip. */
export async function lastBlock(context: BitcoinContext, currencyId: string): Promise<BlockInfo> {
  const config = await context.config(currencyId);
  return toBlockInfo(await fetchCurrentBlock(config, currencyId));
}
