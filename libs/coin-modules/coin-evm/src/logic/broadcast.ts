import type { BroadcastConfig } from "@ledgerhq/coin-module-framework/api/types";
import type { EvmContext } from "../config";
import { getNodeApi } from "../network/node/index";

export async function broadcast(
  context: EvmContext,
  currencyId: string,
  {
    signature,
    broadcastConfig,
  }: {
    signature: string;
    broadcastConfig?: BroadcastConfig | undefined;
  },
): Promise<string> {
  const config = await context.config(currencyId);
  const nodeApi = getNodeApi(config, currencyId);
  return await nodeApi.broadcastTransaction(currencyId, signature, broadcastConfig);
}

export default broadcast;
