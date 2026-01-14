import type { Block, BlockInfo, BlockTransaction } from "@ledgerhq/coin-framework/api/index";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { getNodeApi } from "../network/node";
import { rpcTransactionToBlockOperations } from "../adapters/blockOperations";

export async function getBlock(currency: CryptoCurrency, height: number): Promise<Block> {
  const nodeApi = getNodeApi(currency);
  const result = await nodeApi.getBlockByHeight(currency, height);

  const info: BlockInfo = {
    height: result.height,
    hash: result.hash,
    time: new Date(result.timestamp),
  };

  if (height > 0) {
    const parentResult = await nodeApi.getBlockByHeight(currency, height - 1);
    info.parent = {
      height: parentResult.height,
      hash: parentResult.hash,
      time: new Date(parentResult.timestamp),
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

  const transactionPromises = transactionHashes.map(async (txHash: string) => {
    return await getTransactionFromHash(currency, txHash, nodeApi);
  });

  const transactionResults = await Promise.all(transactionPromises);
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

  const operations = rpcTransactionToBlockOperations(txInfo.from, BigInt(txInfo.value), txInfo.to);

  return {
    hash: txHash,
    failed,
    operations,
    fees,
    feesPayer: txInfo.from,
  };
}
