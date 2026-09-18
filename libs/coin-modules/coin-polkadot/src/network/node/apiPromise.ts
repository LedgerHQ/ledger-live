import { CryptoCurrency } from "@ledgerhq/ledger-wallet-framework/types";
import { ApiPromise, HttpProvider, WsProvider } from "@polkadot/api";
import { type ProviderInterface } from "@polkadot/rpc-provider/types";
import polkadotCoinConfig from "../../config";

// Cache of connections keyed by node URL, so the currency's own node and a dedicated staking
// Asset Hub node can be connected to simultaneously without evicting each other.
const apiCache = new Map<string, Promise<ApiPromise>>();

function createApiPromise(nodeURL: string, credentials?: string): Promise<ApiPromise> {
  const headers = credentials ? { Authorization: "Basic " + credentials } : undefined;

  let provider: HttpProvider | WsProvider;

  if (nodeURL.startsWith("ws://") || nodeURL.startsWith("wss://")) {
    provider = new WsProvider(nodeURL);
  } else if (nodeURL.startsWith("http://") || nodeURL.startsWith("https://")) {
    provider = new HttpProvider(nodeURL, headers);
  } else {
    throw new Error("[Polkadot] Invalid node URL");
  }

  return ApiPromise.create({
    provider: provider as ProviderInterface,
    noInitWarn: true, //to avoid undesired warning (ex: "API/INIT: polkadot/1002000: Not decorating unknown runtime apis")
  });
}

function getApiPromiseByUrl(nodeURL: string, credentials?: string): Promise<ApiPromise> {
  let cached = apiCache.get(nodeURL);
  if (!cached) {
    cached = createApiPromise(nodeURL, credentials);
    apiCache.set(nodeURL, cached);
  }
  return cached;
}

export default async function (currency?: CryptoCurrency): Promise<ApiPromise> {
  const config = polkadotCoinConfig.getCoinConfig(currency?.id);
  return getApiPromiseByUrl(config.node.url, config.node.credentials);
}

/**
 * ApiPromise connection to use for staking-pallet storage reads (activeEra, stashes,
 * commissions, exposure). Resolves to `assetHub.nodeUrl` when configured, falling back to the
 * regular node connection otherwise.
 *
 * The currently-elected validator set (`session.validators()`) must keep using the default
 * export above: an Asset Hub's own `session.validators()` returns its collator set, not the
 * real staking-elected validators.
 */
export async function getStakingApiPromise(currency?: CryptoCurrency): Promise<ApiPromise> {
  const config = polkadotCoinConfig.getCoinConfig(currency?.id);
  if (config.assetHub?.nodeUrl) {
    return getApiPromiseByUrl(config.assetHub.nodeUrl, config.node.credentials);
  }
  return getApiPromiseByUrl(config.node.url, config.node.credentials);
}
