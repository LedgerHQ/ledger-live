import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { getCoinConfig } from "../../config";
import { UnknownNode } from "../../errors";
import ledgerNodeApi from "./ledger";
import { createNodeApi, DEFAULT_RETRIES_RPC_METHODS } from "./rpc";
import { NodeApi } from "./types";

/** Memoized NodeApi instances for external nodes: key = `${currency.id}:${retries}` */
const externalNodeApiCache = new Map<string, NodeApi>();

function cacheKey(currencyId: string, retries: number): string {
  return `${currencyId}:${retries}`;
}

export const getNodeApi = (currency: CryptoCurrency): NodeApi => {
  const config = getCoinConfig(currency).info;

  switch (config?.node?.type) {
    case "ledger":
      return ledgerNodeApi;
    case "external": {
      const retries = config.node.retries ?? DEFAULT_RETRIES_RPC_METHODS;
      const key = cacheKey(currency.id, retries);
      let api = externalNodeApiCache.get(key);
      if (api === undefined) {
        api = createNodeApi(retries);
        externalNodeApiCache.set(key, api);
      }
      return api;
    }

    default:
      throw new UnknownNode(`Unknown node for currency: ${currency.id}`);
  }
};
