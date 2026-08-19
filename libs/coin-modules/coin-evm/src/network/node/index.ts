import { EvmConfigInfo } from "../../config";
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

function cacheKey(currencyId: string, node: { type: string; [key: string]: unknown }): string {
  return `${currencyId}:${JSON.stringify(node)}`;
}

export const getNodeApi = (config: EvmConfigInfo, currencyId: string): NodeApi => {
  const node = config?.node;
  const type = node?.type;

  if (type !== "ledger" && type !== "external") {
    throw new UnknownNode(`Unknown node "${type}" for currency: ${currencyId}`);
  }

  const key = cacheKey(currencyId, node);
  let api = nodeApiCache.get(key);
  if (api === undefined) {
    api = type === "ledger" ? createLedgerNodeApi(node) : createNodeApi(config, node);
    nodeApiCache.set(key, api);
  }
  return api;
};
