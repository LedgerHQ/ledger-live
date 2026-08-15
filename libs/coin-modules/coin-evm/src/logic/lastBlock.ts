import type { BlockInfo } from "@ledgerhq/coin-module-framework/api/index";
import type { EvmContext } from "../config";
import { getNodeApi } from "../network/node";

export async function lastBlock(context: EvmContext, currencyId: string): Promise<BlockInfo> {
  const config = await context.config(currencyId);
  const api = getNodeApi(config, currencyId);
  const { finalizationLevel = "latest" } = config;
  const result = await api.getBlockByHeight(currencyId, finalizationLevel);

  return {
    height: result.height,
    hash: result.hash,
    time: new Date(result.timestamp),
  };
}
