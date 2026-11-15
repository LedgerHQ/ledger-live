import network from "@ledgerhq/live-network";
import { IntDecoding, parseJSON } from "algosdk";
import BigNumber from "bignumber.js";
import type { AlgorandCoinConfig } from "../config";
import type {
  AlgoAssetTransferInfo,
  AlgoPaymentInfo,
  AlgoTransaction,
  AlgoTransactionDetails,
  ExplorerAmount,
  ExplorerTransaction,
  ExplorerTransactions,
} from "./types";

const LIMIT = 100;
const BLOCK_TRANSACTIONS_LIMIT = 1000;

export type GetTransactionsOptions = {
  minRound?: number | undefined;
  limit?: number | undefined;
  nextToken?: string | undefined;
};

export const getAccountTransactions = async (
  config: AlgorandCoinConfig,
  address: string,
  options?: GetTransactionsOptions,
): Promise<{ transactions: AlgoTransaction[]; nextToken?: string }> => {
  const limit = options?.limit ?? LIMIT;
  const url = `${config.indexer}/accounts/${address}/transactions?limit=${limit}`;

  let nextUrl: string = url;
  if (options?.minRound) {
    nextUrl = nextUrl.concat(`&min-round=${options.minRound}`);
  }
  if (options?.nextToken) {
    nextUrl = nextUrl.concat(`&next=${options.nextToken}`);
  }

  const { data } = await network<ExplorerTransactions>({
    url: nextUrl,
  });

  const transactions = data.transactions.map(parseRawTransaction);
  const nextToken = data["next-token"];

  return { transactions, nextToken };
};

export const getAllAccountTransactions = async (
  config: AlgorandCoinConfig,
  address: string,
  startAt?: number,
): Promise<AlgoTransaction[]> => {
  let nextToken: string | undefined;
  const mergedTxs: AlgoTransaction[] = [];

  do {
    const result = await getAccountTransactions(config, address, {
      minRound: startAt,
      nextToken,
    });

    nextToken = result.nextToken;
    mergedTxs.push(...result.transactions);
  } while (nextToken);

  return mergedTxs;
};

/**
 * The top-level transactions of a round, with their inner transactions nested in them.
 */
export const getBlockTransactions = async (
  config: AlgorandCoinConfig,
  round: number,
): Promise<ExplorerTransaction<ExplorerAmount>[]> => {
  const transactions: ExplorerTransaction<ExplorerAmount>[] = [];
  let nextToken: string | undefined;

  do {
    const next = nextToken ? `&next=${nextToken}` : "";
    // live-network hands the request to axios as is, but its type does not declare transformResponse
    const request = {
      url: `${config.indexer}/transactions?round=${round}&limit=${BLOCK_TRANSACTIONS_LIMIT}${next}`,
      transformResponse: parseLosslessJSON,
    };
    const { data } = await network<ExplorerTransactions<ExplorerAmount>>(request);

    // An indexer lagging behind the node answers with no transaction instead of an error
    if (data["current-round"] < round) {
      throw new Error(`Algorand round ${round} is not indexed yet`);
    }

    transactions.push(...data.transactions);
    nextToken = data.transactions.length > 0 ? data["next-token"] : undefined;
  } while (nextToken);

  return transactions;
};

// ASA amounts can exceed Number.MAX_SAFE_INTEGER, which JSON.parse would round
const parseLosslessJSON = (raw: unknown): unknown => {
  if (typeof raw !== "string") return raw;
  try {
    return parseJSON(raw, { intDecoding: IntDecoding.MIXED });
  } catch {
    // Like axios, leave a body that is not JSON (e.g. an HTML error page) as it came
    return raw;
  }
};

const parseRawTransaction = (tx: ExplorerTransaction): AlgoTransaction => {
  let details: AlgoTransactionDetails | undefined = undefined;

  if (tx["tx-type"] === "pay") {
    const info = tx["payment-transaction"]!;
    const paymentInfo: AlgoPaymentInfo = {
      amount: new BigNumber(info.amount),
      recipientAddress: info.receiver,
      closeAmount:
        info["close-amount"] === undefined ? undefined : new BigNumber(info["close-amount"]),
      closeToAddress: info["close-remainder-to"],
    };
    details = paymentInfo;
  } else if (tx["tx-type"] === "axfer") {
    const info = tx["asset-transfer-transaction"]!;
    const assetTransferInfo: AlgoAssetTransferInfo = {
      assetAmount: new BigNumber(info.amount),
      assetId: info["asset-id"].toString(),
      assetRecipientAddress: info.receiver,
      assetSenderAddress: tx.sender,
      assetCloseAmount:
        info["close-amount"] === undefined ? undefined : new BigNumber(info["close-amount"]),
      assetCloseToAddress: info["close-to"],
    };
    details = assetTransferInfo;
  }

  return {
    id: tx.id,
    timestamp: tx["round-time"].toString(),
    round: tx["confirmed-round"],
    senderAddress: tx.sender,
    senderRewards: new BigNumber(tx["sender-rewards"]),
    recipientRewards: new BigNumber(tx["receiver-rewards"]),
    closeRewards:
      tx["close-rewards"] === undefined ? undefined : new BigNumber(tx["close-rewards"]),
    closeAmount:
      tx["closing-amount"] === undefined ? undefined : new BigNumber(tx["closing-amount"]),
    fee: new BigNumber(tx.fee),
    note: tx.note,
    type: tx["tx-type"],
    details,
  };
};
