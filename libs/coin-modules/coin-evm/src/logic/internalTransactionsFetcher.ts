import type { BlockOperation } from "@ledgerhq/coin-module-framework/api/index";
import { log } from "@ledgerhq/logs";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { traceBlockItemsToOperationsByHash } from "../adapters/blockOperations";
import { internalTxsToOperationsByHash } from "../adapters/etherscan";
import { getCoinConfig } from "../config";
import type { InternalTxSource } from "../internalTxSources";
import { SourceUnavailableError } from "../errors";
import { getInternalTransactionsByBlock } from "../network/explorer/etherscan";
import { isEtherscanLikeExplorerConfig } from "../network/explorer/types";
import { NodeApi } from "../network/node/types";

export type InternalTxsByHash = Map<string, BlockOperation[]>;

export type SourceFetcher = (height: number) => Promise<InternalTxsByHash>;

function throwCollectedRealErrors(errors: unknown[]): never {
  if (errors.length === 1) {
    throw errors[0];
  }
  throw new AggregateError(errors, "internal tx sources failed");
}

async function runInternalTxSources(
  sources: readonly InternalTxSource[],
  fetchers: Record<InternalTxSource, SourceFetcher>,
  height: number,
): Promise<InternalTxsByHash> {
  const realErrors: unknown[] = [];
  let hadUnavailableSource = false;

  for (const source of sources) {
    if (source === "empty") {
      if (realErrors.length > 0) {
        throwCollectedRealErrors(realErrors);
      }
      return new Map();
    }

    try {
      return await fetchers[source](height);
    } catch (error) {
      if (error instanceof SourceUnavailableError) {
        hadUnavailableSource = true;
        continue;
      }
      realErrors.push(error);
    }
  }

  if (realErrors.length > 0) {
    throwCollectedRealErrors(realErrors);
  }

  if (hadUnavailableSource) {
    throw new SourceUnavailableError("all internal tx sources unavailable");
  }

  throw new Error("no internal tx sources configured");
}

export function composeInternalTxsFetcher(
  sources: readonly InternalTxSource[],
  fetchers: Record<InternalTxSource, SourceFetcher>,
): SourceFetcher {
  return (height: number) => runInternalTxSources(sources, fetchers, height);
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
        log("coin-evm", "debug: trace_block internal tx source unavailable", {
          currencyId: currency.id,
          blockHeight: height,
        });
        return Promise.reject(
          new SourceUnavailableError("trace_block is not supported by this RPC provider"),
        );
      }
      return nodeApi.traceBlockErigon(currency, height).then(traceBlockItemsToOperationsByHash);
    },
    debug_traceBlockByNumber: (height: number) => {
      if (nodeApi.traceBlockGeth === undefined) {
        log("coin-evm", "debug: debug_traceBlockByNumber internal tx source unavailable", {
          currencyId: currency.id,
          blockHeight: height,
        });
        return Promise.reject(
          new SourceUnavailableError(
            "debug_traceBlockByNumber is not supported by this RPC provider",
          ),
        );
      }
      return nodeApi.traceBlockGeth(currency, height).then(traceBlockItemsToOperationsByHash);
    },
    explorer: (height: number) => {
      if (!isEtherscanLikeExplorerConfig(explorer)) {
        return Promise.reject(
          new SourceUnavailableError(
            `explorer internal txs not configured for currency ${currency.id}`,
          ),
        );
      }
      return getInternalTransactionsByBlock(currency, height)
        .then(internalTxsToOperationsByHash)
        .catch(error => {
          log("coin-evm", "debug: explorer internal txs failed, falling through", {
            currencyId: currency.id,
            blockHeight: height,
            error,
          });
          return Promise.reject(new SourceUnavailableError("explorer internal txs failed"));
        });
    },
    empty: async () => new Map<string, BlockOperation[]>(),
  };
}

export function createInternalTransactionsFetcher(
  nodeApi: NodeApi,
  currency: CryptoCurrency,
  sources: readonly InternalTxSource[],
): SourceFetcher {
  return composeInternalTxsFetcher(sources, makeSourceFetchers(nodeApi, currency));
}
