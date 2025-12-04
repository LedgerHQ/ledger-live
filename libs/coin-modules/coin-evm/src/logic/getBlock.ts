import type { Block, BlockInfo, BlockTransaction } from "@ledgerhq/coin-framework/api/index";
import { getEnv } from "@ledgerhq/live-env";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { getCoinConfig } from "../config";
import { fetchWithRetries } from "../network/node/ledger";
import { getNodeApi } from "../network/node";
import { isExternalNodeConfig, isLedgerNodeConfig } from "../network/node/types";
import { LedgerExplorerOperation } from "../types";
import {
  ledgerTransactionToBlockOperations,
  rpcTransactionToBlockOperations,
} from "../adapters/blockOperations";

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

  const config = getCoinConfig(currency).info;
  const { node } = config || {};

  let transactions: BlockTransaction[] = [];
  if (isExternalNodeConfig(node)) {
    transactions = await getTransactionsFromRpcNode(
      currency,
      result.transactionHashes || [],
      nodeApi,
    );
  } else if (isLedgerNodeConfig(node)) {
    transactions = await getTransactionsFromLedgerNode(currency, node.explorerId, info.hash!);
  }

  return {
    info,
    transactions,
  };
}
async function getTransactionsFromRpcNode(
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

async function getTransactionsFromLedgerNode(
  currency: CryptoCurrency,
  explorerId: string,
  blockHash: string,
): Promise<BlockTransaction[]> {
  const ledgerTransactions = await fetchWithRetries<LedgerExplorerOperation[]>({
    method: "GET",
    url: `${getEnv("EXPLORER")}/blockchain/v4/${explorerId}/block/${blockHash}/txs`,
  });

  if (!ledgerTransactions || ledgerTransactions.length === 0) {
    return [];
  }

  return ledgerTransactions.map(ledgerTransaction => {
    const failed = ledgerTransaction.status === 0;
    const fees = BigInt(ledgerTransaction.gas_used) * BigInt(ledgerTransaction.gas_price);
    const feesPayer = ledgerTransaction.from || "";

    const operations = ledgerTransactionToBlockOperations(ledgerTransaction);

    return {
      hash: ledgerTransaction.hash,
      failed,
      operations,
      fees,
      feesPayer,
    };
  });
}
