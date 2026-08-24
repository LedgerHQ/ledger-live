import type { EvmConfigInfo } from "../../config";
import { DEFAULT_LEDGER_EXPLORER_URI } from "../../config";
import { UnknownNode } from "../../errors";
import { createLedgerNodeApi } from "./ledger";
import { createNodeApi } from "./rpc";
import type { NodeApi } from "./types";

/**
 * Memoized NodeApi instances for both ledger and external nodes.
 * Key = `${currencyId}:${JSON.stringify(node)}:${ledgerExplorerUri}:${ledgerClientVersion}`.
 * The explorer settings are in the key because the ledger api captures them at creation.
 * Unbounded growth is acceptable: the number of entries is at most (currencies × distinct
 * node configs). In practice there are few EVM chains and config is static per currency,
 * so the cache stays small.
 */
const nodeApiCache = new Map<string, NodeApi>();

function cacheKey(
  currencyId: string,
  node: { type: string; [key: string]: unknown },
  explorerUri: string,
  clientVersion: string,
): string {
  return `${currencyId}:${JSON.stringify(node)}:${explorerUri}:${clientVersion}`;
}

export const getNodeApi = (config: EvmConfigInfo, currencyId: string): NodeApi => {
  const node = config?.node;
  const type = node?.type;

  if (type !== "ledger" && type !== "external") {
    throw new UnknownNode(`Unknown node "${type}" for currency: ${currencyId}`);
  }

  const explorerUri = config.ledgerExplorerUri ?? DEFAULT_LEDGER_EXPLORER_URI;
  const clientVersion = config.ledgerClientVersion ?? "";
  const key = cacheKey(currencyId, node, explorerUri, clientVersion);
  let api = nodeApiCache.get(key);
  if (api === undefined) {
    api =
      type === "ledger"
        ? createLedgerNodeApi({ ...node, explorerUri, clientVersion })
        : createNodeApi(config, node);
    nodeApiCache.set(key, api);
  }
  return api;
};
