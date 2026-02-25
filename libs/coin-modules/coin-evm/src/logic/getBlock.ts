import type { Block, BlockInfo, BlockTransaction } from "@ledgerhq/coin-framework/api/index";
import { promiseAllBatched } from "@ledgerhq/live-promise";
import { log } from "@ledgerhq/logs";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { rpcTransactionToBlockOperations } from "../adapters/blockOperations";
import { getNodeApi } from "../network/node";
import { RpcUnsupportedError } from "../network/node/rpc.common";
import { BlockReceiptInfo, PrefetchedBlockTransaction } from "../network/node/types";

export async function getBlock(currency: CryptoCurrency, height: number): Promise<Block> {
  // Note: to use RPC calls efficiently, the strategy here is:
  //  - fetch the block + transactions in one call (using prefetchTxs=true)
  //  - fetch transaction receipts in one call using eth_getBlockReceipts
  //  - if the RPC does not support prefetchTxs or eth_getBlockReceipts, fall back to fetching the transaction+receipts
  //    one by one
  const nodeApi = getNodeApi(currency);
  const result = await nodeApi.getBlockByHeight(currency, height, true);

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
    result.transactions?.map(tx => tx.hash) || result.transactionHashes || [],
    nodeApi,
    result.height,
    result.transactions,
  );

  return {
    info,
    transactions,
  };
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
    if (!(error instanceof RpcUnsupportedError) || error.method !== "eth_getBlockReceipts")
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

  return {
    hash: tx.hash,
    failed,
    operations,
    fees,
    feesPayer: tx.from,
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

  return {
    hash: txHash,
    failed,
    operations,
    fees,
    feesPayer: txInfo.from,
  };
}
