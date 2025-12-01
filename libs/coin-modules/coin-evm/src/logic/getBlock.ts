import type { Block, BlockInfo, BlockTransaction } from "@ledgerhq/coin-framework/api/index";
import { getEnv } from "@ledgerhq/live-env";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { JsonRpcProvider } from "ethers";
import { getCoinConfig } from "../config";
import { fetchWithRetries } from "../network/node/ledger";
import { getNodeApi } from "../network/node";
import { withApi } from "../network/node/rpc.common";
import { isExternalNodeConfig, isLedgerNodeConfig } from "../network/node/types";
import { LedgerExplorerBlock, LedgerExplorerOperation } from "../types";
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

  const config = getCoinConfig(currency).info;
  const { node } = config || {};

  let transactions: BlockTransaction[] = [];
  if (isExternalNodeConfig(node)) {
    transactions = await getTransactionsFromRpcNode(currency, height);
  } else if (isLedgerNodeConfig(node)) {
    transactions = await getTransactionsFromLedgerNode(currency, node.explorerId, height);
  }

  return {
    info,
    transactions,
  };
}

async function getTransactionsFromRpcNode(
  currency: CryptoCurrency,
  height: number,
): Promise<BlockTransaction[]> {
  const block = await withApi(currency, async (api: JsonRpcProvider) => {
    return await api.getBlock(height, true);
  });

  if (!block?.transactions) {
    return [];
  }

  const transactionPromises = block.transactions.map(async (txHash: string) => {
    return await getTransactionFromHash(currency, txHash);
  });

  const transactionResults = await Promise.all(transactionPromises);
  return transactionResults.filter((tx): tx is BlockTransaction => tx !== null);
}

async function getTransactionFromHash(
  currency: CryptoCurrency,
  txHash: string,
): Promise<BlockTransaction | null> {
  const txData = await withApi(currency, async (api: JsonRpcProvider) => {
    const [fullTx, receipt] = await Promise.all([
      api.getTransaction(txHash),
      api.getTransactionReceipt(txHash),
    ]);
    return { fullTx, receipt };
  });

  if (!txData.fullTx || !txData.receipt) {
    return null;
  }

  const failed = txData.receipt.status === 0;
  const gasPrice = txData.fullTx.gasPrice?.toString() || "0";
  const gasUsed = txData.receipt.gasUsed.toString();
  const fees = BigInt(gasUsed) * BigInt(gasPrice);

  const operations = rpcTransactionToBlockOperations(txData.fullTx);

  return {
    hash: txHash,
    failed,
    operations,
    fees,
    feesPayer: txData.fullTx.from || "",
  };
}

async function getTransactionsFromLedgerNode(
  currency: CryptoCurrency,
  explorerId: string,
  height: number,
): Promise<BlockTransaction[]> {
  const blockData = await fetchWithRetries<[LedgerExplorerBlock]>({
    method: "GET",
    url: `${getEnv("EXPLORER")}/blockchain/v4/${explorerId}/block/${height}`,
  });

  const [{ txs }] = blockData;

  if (!txs || txs.length === 0) {
    return [];
  }

  const transactionPromises = txs.map(async txHash => {
    const ledgerTransaction = await fetchWithRetries<LedgerExplorerOperation>({
      method: "GET",
      url: `${getEnv("EXPLORER")}/blockchain/v4/${explorerId}/tx/${txHash}`,
    });

    const failed = ledgerTransaction.status === 0;
    const fees = BigInt(ledgerTransaction.gas_used) * BigInt(ledgerTransaction.gas_price);
    const feesPayer = ledgerTransaction.from || "";

    const operations = ledgerTransactionToBlockOperations(ledgerTransaction);

    return {
      hash: txHash,
      failed,
      operations,
      fees,
      feesPayer,
    };
  });

  return await Promise.all(transactionPromises);
}
