import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { BroadcastConfig } from "@ledgerhq/types-live";
import { getNodeApi } from "../network/node/index";

export async function broadcast(
  currency: CryptoCurrency,
  {
    signature,
    broadcastConfig,
  }: {
    signature: string;
    broadcastConfig?: BroadcastConfig | undefined;
  },
): Promise<string> {
  const nodeApi = getNodeApi(currency);
  return await nodeApi.broadcastTransaction(currency, signature, broadcastConfig);
}

export default broadcast;
