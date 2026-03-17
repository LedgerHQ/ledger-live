import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { getCoinConfig } from "../../config";
import { UnknownNode } from "../../errors";
import { createLedgerNodeApi } from "./ledger";
import { createNodeApi } from "./rpc";
import { NodeApi } from "./types";

/**
 * Memoized NodeApi instances for both ledger and external nodes.
 * Key = `${currencyId}:${type}:${JSON.stringify(node)}`.
 * Unbounded growth is acceptable: the number of entries is at most (currencies × distinct
 * node configs). In practice there are few EVM chains and config is static per currency,
 * so the cache stays small.
 */
const nodeApiCache = new Map<string, NodeApi>();

function cacheKey(
  currencyId: string,
  type: string,
  node: { type: string; [key: string]: unknown },
): string {
  return `${currencyId}:${type}:${JSON.stringify(node)}`;
}

export const getNodeApi = (currency: CryptoCurrency): NodeApi => {
  const config = getCoinConfig(currency).info;
  const node = config?.node;
  const type = node?.type;

  if (type !== "ledger" && type !== "external") {
    throw new UnknownNode(`Unknown node "${type}" for currency: ${currency.id}`);
  }

  const key = cacheKey(currency.id, type, node);
  let api = nodeApiCache.get(key);
  if (api === undefined) {
    api = type === "ledger" ? createLedgerNodeApi(node) : createNodeApi(node);
    nodeApiCache.set(key, api);
  }
  return api;
};
