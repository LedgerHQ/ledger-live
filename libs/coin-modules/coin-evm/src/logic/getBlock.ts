import type {
  Block,
  BlockInfo,
  BlockOperation,
  BlockTransaction,
  TransferBlockOperation,
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
import { dropRootTraceDuplicates } from "./rootTraceDedup";
import { buildSmartContractDetails, safeEncodeEIP55 } from "../utils";

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
 * Runs a provider-agnostic root-trace dedup on internal native operations: any internal op
 * whose `(address, peer, amount)` tuple exactly matches one of the coin tx's own native ops
 * is dropped, because it represents the same value transfer reported twice. ERC20/721/1155
 * ops come from receipt logs, so they are never touched here.
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
      const blockTx = prefetchedTransactionToBlockTransaction(tx, receipt);
      transactions.push({
        ...blockTx,
        operations: applyChainSpecificCorrections(currency, blockTx.operations, receipt.type),
      });
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
  // Some EVM chains (e.g. Cronos) omit `gasPrice` from transaction
  // receipts. In that case, fall back to the prefetched tx's normalized `gasPrice`
  // (the node layer provides `0` when the raw `eth_getBlockByNumber(_, true)` payload omits it).
  const receiptGasPrice = BigInt(receipt.gasPrice);
  const gasPrice = receiptGasPrice > 0n ? receiptGasPrice : BigInt(tx.gasPrice);
  const fees = BigInt(receipt.gasUsed) * gasPrice;
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

  const rawOperations = rpcTransactionToBlockOperations(txInfo);
  const operations = applyChainSpecificCorrections(currency, rawOperations, txInfo.type);

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

const ZKSYNC_MINT_PEER = safeEncodeEIP55("0x0000000000000000000000000000000000000000");

function applyChainSpecificCorrections(
  currency: CryptoCurrency,
  operations: BlockOperation[],
  receiptType: number | undefined,
): BlockOperation[] {
  switch (currency.id) {
    case "zksync":
      return rewriteZkSyncL1ToL2DepositOps(operations, receiptType);
    default:
      return operations;
  }
}

/**
 * On zkSync L1→L2 priority txs (receipt.type === 0xff): replace the cancelling native self
 * pair (from `tx.value`) with a single credit op (`peer = 0x0`), and drop mint-source ops
 * on `0x0` (noise).
 */
function rewriteZkSyncL1ToL2DepositOps(
  operations: BlockOperation[],
  receiptType: number | undefined,
): BlockOperation[] {
  if (receiptType !== 0xff) return operations;
  const withoutMintSource = operations.filter(
    op => op.type !== "transfer" || op.address.toLowerCase() !== ZKSYNC_MINT_PEER.toLowerCase(),
  );
  const nativeSelf = withoutMintSource.find(
    (op): op is TransferBlockOperation =>
      op.type === "transfer" &&
      op.asset.type === "native" &&
      op.amount > 0n &&
      op.peer !== undefined &&
      op.address.toLowerCase() === op.peer.toLowerCase(),
  );
  if (!nativeSelf) return withoutMintSource;
  const nativeCredit: TransferBlockOperation = {
    type: "transfer",
    address: nativeSelf.address,
    peer: ZKSYNC_MINT_PEER,
    asset: { type: "native" },
    amount: nativeSelf.amount,
  };
  return [
    nativeCredit,
    ...withoutMintSource.filter(op => op.type !== "transfer" || op.asset.type !== "native"),
  ];
}
