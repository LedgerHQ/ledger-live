import type { Block, BlockInfo, BlockTransaction } from "@ledgerhq/coin-framework/api/index";
import { promiseAllBatched } from "@ledgerhq/live-promise";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { rpcTransactionToBlockOperations } from "../adapters/blockOperations";
import { getNodeApi } from "../network/node";

export async function getBlock(currency: CryptoCurrency, height: number): Promise<Block> {
  const nodeApi = getNodeApi(currency);
  const result = await nodeApi.getBlockByHeight(currency, height);

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
    result.transactionHashes || [],
    nodeApi,
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
): Promise<BlockTransaction[]> {
  if (transactionHashes.length === 0) {
    return [];
  }

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
