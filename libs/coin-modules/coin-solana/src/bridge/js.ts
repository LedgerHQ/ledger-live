import { makeLRUCache, minutes } from "@ledgerhq/live-network/cache";
import { log } from "@ledgerhq/logs";
import { cached, Config, getChainAPI, queued } from "../network";
import { traced } from "../network/traced";
import { makeBridges } from "./bridge";
import { SignerContext } from "@ledgerhq/coin-framework/signer";
import { SolanaSigner } from "../signer";
import { CoinConfig } from "@ledgerhq/coin-framework/config";
import solanaCoinConfig, { SolanaCoinConfig } from "../config";

const httpRequestLogger = (url: string, options: any) => {
  log("network", url, {
    method: options?.method,
    body: options?.body,
    params: options?.params,
  });
};

const getAPI = makeLRUCache(
  (config: Config) => Promise.resolve(traced(getChainAPI(config, httpRequestLogger))),
  config => config.endpoint,
  minutes(1000),
);

const getQueuedAPI = makeLRUCache(
  (config: Config) =>
    getAPI(config).then(api => queued(api, solanaCoinConfig.getCoinConfig().queuedInterval)),
  config => config.endpoint,
  minutes(1000),
);

const getQueuedAndCachedAPI = makeLRUCache(
  (config: Config) => getQueuedAPI(config).then(cached),
  config => config.endpoint,
  minutes(1000),
);

export function createBridges(
  signerContext: SignerContext<SolanaSigner>,
  coinConfig: CoinConfig<SolanaCoinConfig>,
) {
  solanaCoinConfig.setCoinConfig(coinConfig);
  return makeBridges({
    getAPI,
    getQueuedAPI,
    getQueuedAndCachedAPI,
    signerContext,
  });
}
