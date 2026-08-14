import type { BlockInfo } from "@ledgerhq/coin-module-framework/api/index";
import { fetchLastBlock } from "../network/api";
import type { CasperContext } from "../types/config";

export async function lastBlock(context: CasperContext): Promise<BlockInfo> {
  const config = await context.config();
  return fetchLastBlock(config);
}
