import { CoinConfig } from "@ledgerhq/coin-framework/config";
import { SignerContext } from "@ledgerhq/coin-framework/signer";
import { log } from "@ledgerhq/logs";
import solanaCoinConfig, { SolanaCoinConfig } from "../config";
import { ChainAPI, Config, getChainAPI } from "../network";
import { SolanaSigner } from "../signer";
import { makeBridges } from "./bridge";

const httpRequestLogger = (url: string, options: any) => {
  log("network", url, {
    method: options?.method,
    body: options?.body,
    params: options?.params,
  });
};

export function createBridges(
  signerContext: SignerContext<SolanaSigner>,
  coinConfig: CoinConfig<SolanaCoinConfig>,
) {
  solanaCoinConfig.setCoinConfig(coinConfig);
  const chainAPICache = new Map<string, ChainAPI>();
  return makeBridges({
    getAPI: (config: Config) => {
      const endpoint = config.endpoint;
      if (!chainAPICache.has(endpoint)) {
        chainAPICache.set(endpoint, getChainAPI(config, httpRequestLogger));
      }
      return chainAPICache.get(endpoint)!;
    },
    signerContext,
  });
}
