import type { BroadcastConfig } from "@ledgerhq/coin-module-framework/api/types";
import { CryptoCurrency } from "@ledgerhq/ledger-wallet-framework/types";
import type { EvmContext } from "../config";
import { getNodeApi } from "../network/node/index";

export async function broadcast(
  context: EvmContext,
  currency: CryptoCurrency,
  {
    signature,
    broadcastConfig,
  }: {
    signature: string;
    broadcastConfig?: BroadcastConfig | undefined;
  },
): Promise<string> {
  const config = await context.config(currency.id);
  const nodeApi = getNodeApi(config, currency);
  return await nodeApi.broadcastTransaction(currency, signature, broadcastConfig);
}

export default broadcast;
