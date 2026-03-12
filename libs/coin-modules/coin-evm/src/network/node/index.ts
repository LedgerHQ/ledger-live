import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { getCoinConfig } from "../../config";
import { UnknownNode } from "../../errors";
import ledgerNodeApi from "./ledger";
import { createNodeApi } from "./rpc";
import { NodeApi } from "./types";

/** Memoized NodeApi instances for external nodes: key = `${currency.id}:${retries}` */
const externalNodeApiCache = new Map<string, NodeApi>();

function cacheKey(
  currencyId: string,
  node: { type: string; uri: string; retries?: number },
): string {
  return `${currencyId}:${JSON.stringify(node)}`;
}

export const getNodeApi = (currency: CryptoCurrency): NodeApi => {
  const config = getCoinConfig(currency).info;

  switch (config?.node?.type) {
    case "ledger":
      return ledgerNodeApi;
    case "external": {
      const key = cacheKey(currency.id, config.node);
      let api = externalNodeApiCache.get(key);
      if (api === undefined) {
        api = createNodeApi(config.node);
        externalNodeApiCache.set(key, api);
      }
      return api;
    }

    default:
      throw new UnknownNode(`Unknown node for currency: ${currency.id}`);
  }
};
