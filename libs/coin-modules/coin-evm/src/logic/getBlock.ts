import type {
  Block,
  BlockInfo,
  BlockOperation,
  BlockTransaction,
} from "@ledgerhq/coin-module-framework/api/index";
import { promiseAllBatched } from "@ledgerhq/live-promise";
import { log } from "@ledgerhq/logs";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import {
  rpcTransactionToBlockOperations,
  traceBlockItemsToOperationsByHash,
} from "../adapters/blockOperations";
import { internalTxsToOperationsByHash } from "../adapters/etherscan";
import { getCoinConfig } from "../config";
import { UnsupportedRpcMethodError } from "../errors";
import { getInternalTransactionsByBlock } from "../network/explorer/etherscan";
import { isEtherscanLikeExplorerConfig } from "../network/explorer/types";
import { getNodeApi } from "../network/node";
import { BlockReceiptInfo, NodeApi, PrefetchedBlockTransaction } from "../network/node/types";
import { buildSmartContractDetails } from "../utils";

function internalTransactionsFetcher(
  nodeApi: NodeApi,
  currency: CryptoCurrency,
): (height: number) => Promise<Map<string, BlockOperation[]>> {
  const config = getCoinConfig(currency.id).info;
  const { explorer } = config || {};

  async function nodeFallback(height: number): Promise<Map<string, BlockOperation[]>> {
    if (nodeApi.traceBlock === undefined) {
      // no support for traceBlock, return empty map,
      // this could be buggy but we can't just throw an error, that would break consumer app
      log("coin-evm", "error: no internal transactions support for this currency", {
        currencyId: currency.id,
        blockHeight: height,
      });
      return new Map();
    } else {
      return nodeApi.traceBlock(currency, height).then(traceBlockItemsToOperationsByHash);
    }
  }

  if (isEtherscanLikeExplorerConfig(explorer)) {
    return (height: number) =>
      getInternalTransactionsByBlock(currency, height)
        .then(internalTxsToOperationsByHash)
        .catch(async _error => nodeFallback(height));
  } else {
    return nodeFallback;
  }
}

export async function getBlock(currency: CryptoCurrency, height: number): Promise<Block> {
  // Note: to use RPC calls efficiently, the strategy here is:
  //  - fetch the block + transactions in one call (using prefetchTxs=true)
  //  - fetch transaction receipts in one call using eth_getBlockReceipts
  //  - if the RPC does not support prefetchTxs or eth_getBlockReceipts, fall back to fetching the transaction+receipts
  //    one by one
  //  - in parallel, fetch internal transactions from explorer (etherscan/blockscout) and merge into block transactions
  const nodeApi = getNodeApi(currency);
  const fetchInternalTxs = internalTransactionsFetcher(nodeApi, currency);
  const [result, internalTxs] = await Promise.all([
    nodeApi.getBlockByHeight(currency, height, true),
    fetchInternalTxs(height),
  ]);

  const info: BlockInfo = {
    height: result.height,
    hash: result.hash,
    time: new Date(result.timestamp),
  };

  if (height > 0 && result.parentHash && !/^0x0+$/.test(result.parentHash)) {
    info.parent = {
      height: result.height - 1,
      hash: result.parentHash,
    };
  }

  const transactions = await getTransactionsFromNode(
    currency,
    result.transactionHashes || result.transactions?.map(tx => tx.hash) || [],
    nodeApi,
    result.height,
    result.transactions,
  );

  const mergedTransactions = mergeInternalTransactions(transactions, internalTxs);

  return {
    info,
    transactions: mergedTransactions,
  };
}

/**
 * Merges internal transaction operations into block transactions by matching tx hash.
 *
 * Runs a provider-agnostic root-trace dedup: any internal op whose
 * `(address, peer, amount, asset)` tuple exactly matches one of the coin tx's own native
 * operations is dropped, because it represents the same value transfer reported twice.
 *
 * This complements the semantic filters applied upstream by each adapter:
 *   - `traceBlockItemsToOperationsByHash` skips items with `traceAddress.length === 0` and
 *     items whose `callType` is `delegatecall`/`staticcall`/`callcode`.
 *   - `internalTxsToOperationsByHash` skips items whose `callType` (Blockscout) or `type`
 *     (Etherscan) matches the same non-value-transferring call types.
 *
 * The structural dedup here is the last line of defence: if a provider surfaces the root call
 * in a shape the adapter didn't anticipate (e.g. a future explorer variant), it still gets
 * collapsed into the coin tx's own ops.
 */
function mergeInternalTransactions(
  transactions: BlockTransaction[],
  internalTxs: Map<string, BlockOperation[]>,
): BlockTransaction[] {
  if (internalTxs.size === 0) return transactions;

  return transactions.map(tx => {
    const extraOps = internalTxs.get(tx.hash);
    if (!extraOps || extraOps.length === 0) return tx;
    const dedupedExtraOps = dropRootTraceDuplicates(tx.operations, extraOps);
    if (dedupedExtraOps.length === 0) return tx;
    return {
      ...tx,
      operations: [...tx.operations, ...dedupedExtraOps],
    };
  });
}

/**
 * Drops any internal op that is structurally identical to one of the coin tx's native ops.
 * Only native-asset ops are considered: ERC20/721/1155 ops are surfaced by receipt logs,
 * which are a different (non-overlapping) source.
 */
export function dropRootTraceDuplicates(
  coinOps: readonly BlockOperation[],
  internalOps: readonly BlockOperation[],
): BlockOperation[] {
  const coinNativeSignatures = new Set<string>();
  for (const op of coinOps) {
    if (op.type !== "transfer" || op.asset.type !== "native") continue;
    coinNativeSignatures.add(signatureOf(op));
  }
  if (coinNativeSignatures.size === 0) return [...internalOps];
  return internalOps.filter(op => {
    if (op.type !== "transfer" || op.asset.type !== "native") return true;
    return !coinNativeSignatures.has(signatureOf(op));
  });
}

function signatureOf(op: BlockOperation): string {
  if (op.type !== "transfer") return "";
  const addr = (op.address ?? "").toLowerCase();
  const peer = ("peer" in op && op.peer ? op.peer : "").toLowerCase();
  const amount = op.amount?.toString() ?? "";
  return `${addr}\t${peer}\t${amount}`;
}

async function getTransactionsFromNode(
  currency: CryptoCurrency,
  transactionHashes: string[],
  nodeApi: ReturnType<typeof getNodeApi>,
  blockHeight: number,
  prefetchedTransactions?: PrefetchedBlockTransaction[],
): Promise<BlockTransaction[]> {
  if (transactionHashes.length === 0) return [];

  const bulkTransactions = await getTransactionsFromPrefetchedData(
    currency,
    blockHeight,
    prefetchedTransactions,
    nodeApi,
  );
  if (bulkTransactions) return bulkTransactions;

  // some RPC nodes like the one on mainnet.optimism.io are limited to 10 concurrent calls
  // given that the underlying nodeApi calls are doing 2 calls in parallel to fetch the transaction
  // and given that we may have other concurrent calls to the nodeApi from other blocks or api
  // and given that performance expectation is not critical for this api
  // => concurrency of 2 will use 4 amongst the 10 concurrent calls allowed by the node
  // => give good enough performance for the api
  // Note: there is also a max number of calls per second limit on mainnet.optimism.io
  const MAX_CONCURRENCY = 2;
  const transactionResults = await promiseAllBatched(
    MAX_CONCURRENCY,
    transactionHashes,
    (txHash: string) => getTransactionFromHash(currency, txHash, nodeApi),
  );

  return transactionResults.filter((tx): tx is BlockTransaction => tx !== null);
}

async function getTransactionsFromPrefetchedData(
  currency: CryptoCurrency,
  blockHeight: number,
  prefetchedTransactions: PrefetchedBlockTransaction[] | undefined,
  nodeApi: ReturnType<typeof getNodeApi>,
): Promise<BlockTransaction[] | null> {
  if (!prefetchedTransactions || prefetchedTransactions.length === 0 || !nodeApi.getBlockReceipts)
    return null;

  try {
    const receipts = await nodeApi.getBlockReceipts(currency, blockHeight);
    const receiptsByHash = new Map(receipts.map(receipt => [receipt.hash, receipt]));

    const transactions: BlockTransaction[] = [];
    for (const tx of prefetchedTransactions) {
      const receipt = receiptsByHash.get(tx.hash);
      if (!receipt) return null;
      transactions.push(prefetchedTransactionToBlockTransaction(tx, receipt));
    }

    return transactions;
  } catch (error) {
    if (!(error instanceof UnsupportedRpcMethodError) || error.method !== "eth_getBlockReceipts")
      throw error;

    log("warn", "EVM getBlock fallback: eth_getBlockReceipts unsupported", {
      currencyId: currency.id,
      blockHeight,
      error: error.rawError,
    });
    return null;
  }
}

function prefetchedTransactionToBlockTransaction(
  tx: PrefetchedBlockTransaction,
  receipt: BlockReceiptInfo,
): BlockTransaction {
  const failed = receipt.status === 0;
  const fees = BigInt(receipt.gasUsed) * BigInt(receipt.gasPrice);
  const operations = rpcTransactionToBlockOperations({
    from: tx.from,
    to: tx.to,
    value: tx.value,
    erc20Transfers: receipt.erc20Transfers,
  });

  const details = buildSmartContractDetails(tx.to, tx.input, receipt.contractAddress);

  return {
    hash: tx.hash,
    failed,
    operations,
    fees,
    feesPayer: tx.from,
    ...(details ? { details } : {}),
  };
}

async function getTransactionFromHash(
  currency: CryptoCurrency,
  txHash: string,
  nodeApi: ReturnType<typeof getNodeApi>,
): Promise<BlockTransaction | null> {
  const txInfo = await nodeApi.getTransaction(currency, txHash);

  const failed = txInfo.status === 0;
  const fees = BigInt(txInfo.gasUsed) * BigInt(txInfo.gasPrice);

  const operations = rpcTransactionToBlockOperations(txInfo);

  const details = buildSmartContractDetails(txInfo.to, txInfo.input, txInfo.contractAddress);

  return {
    hash: txHash,
    failed,
    operations,
    fees,
    feesPayer: txInfo.from,
    ...(details ? { details } : {}),
  };
}
