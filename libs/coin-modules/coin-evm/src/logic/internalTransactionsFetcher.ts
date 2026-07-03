import type { BlockOperation } from "@ledgerhq/coin-module-framework/api/index";
import { log } from "@ledgerhq/logs";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { traceBlockItemsToOperationsByHash } from "../adapters/blockOperations";
import { internalTxsToOperationsByHash } from "../adapters/etherscan";
import { getCoinConfig } from "../config";
import type { InternalTxSource } from "../internalTxSources";
import { UnsupportedRpcMethodError } from "../errors";
import { getInternalTransactionsByBlock } from "../network/explorer/etherscan";
import { isEtherscanLikeExplorerConfig } from "../network/explorer/types";
import { NodeApi } from "../network/node/types";

export type InternalTxsByHash = Map<string, BlockOperation[]>;

export type SourceFetcher = (height: number) => Promise<InternalTxsByHash>;

export function composeInternalTxsFetcher(
  sources: readonly InternalTxSource[],
  fetchers: Record<InternalTxSource, SourceFetcher>,
): SourceFetcher {
  return (height: number) =>
    sources.reduce(
      (acc, source) => acc.catch(() => fetchers[source](height)),
      Promise.reject<InternalTxsByHash>(new Error("no internal tx sources configured")),
    );
}

export function makeSourceFetchers(
  nodeApi: NodeApi,
  currency: CryptoCurrency,
): Record<InternalTxSource, SourceFetcher> {
  const config = getCoinConfig(currency.id).info;
  const { explorer } = config || {};

  return {
    trace_block: (height: number) => {
      if (nodeApi.traceBlockErigon === undefined) {
        log("coin-evm", "error: no internal transactions support for this currency", {
          currencyId: currency.id,
          blockHeight: height,
          source: "trace_block",
        });
        return Promise.reject(
          new UnsupportedRpcMethodError("trace_block is not supported by this RPC provider", {
            method: "trace_block",
            rawError: undefined,
          }),
        );
      }
      return nodeApi.traceBlockErigon(currency, height).then(traceBlockItemsToOperationsByHash);
    },
    debug_traceBlockByNumber: (height: number) => {
      if (nodeApi.traceBlockGeth === undefined) {
        log("coin-evm", "error: no internal transactions support for this currency", {
          currencyId: currency.id,
          blockHeight: height,
          source: "debug_traceBlockByNumber",
        });
        return Promise.reject(
          new UnsupportedRpcMethodError(
            "debug_traceBlockByNumber is not supported by this RPC provider",
            {
              method: "debug_traceBlockByNumber",
              rawError: undefined,
            },
          ),
        );
      }
      return nodeApi.traceBlockGeth(currency, height).then(traceBlockItemsToOperationsByHash);
    },
    explorer: (height: number) => {
      if (!isEtherscanLikeExplorerConfig(explorer)) {
        return Promise.reject(
          new Error(`explorer internal txs not configured for currency ${currency.id}`),
        );
      }
      return getInternalTransactionsByBlock(currency, height).then(internalTxsToOperationsByHash);
    },
    empty: async () => new Map(),
  };
}

export function createInternalTransactionsFetcher(
  nodeApi: NodeApi,
  currency: CryptoCurrency,
  sources: readonly InternalTxSource[],
): SourceFetcher {
  return composeInternalTxsFetcher(sources, makeSourceFetchers(nodeApi, currency));
}
