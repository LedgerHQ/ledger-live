import network from "@ledgerhq/live-network";
import { BigNumber } from "bignumber.js";
import coinConfig from "../config";
import type {
  AlgoAssetTransferInfo,
  AlgoPaymentInfo,
  AlgoTransaction,
  AlgoTransactionDetails,
  ExplorerTransaction,
  ExplorerTransactions,
} from "./types";

const LIMIT = 100;

const getIndexerUrl = (): string => coinConfig.getCoinConfig().indexer;

export type GetTransactionsOptions = {
  minRound?: number | undefined;
  limit?: number | undefined;
  nextToken?: string | undefined;
};

export const getAccountTransactions = async (
  address: string,
  options?: GetTransactionsOptions,
): Promise<{ transactions: AlgoTransaction[]; nextToken?: string }> => {
  const limit = options?.limit ?? LIMIT;
  const url = `${getIndexerUrl()}/accounts/${address}/transactions?limit=${limit}`;

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
  address: string,
  startAt?: number,
): Promise<AlgoTransaction[]> => {
  let nextToken: string | undefined;
  const mergedTxs: AlgoTransaction[] = [];

  do {
    const result = await getAccountTransactions(address, {
      minRound: startAt,
      nextToken,
    });

    nextToken = result.nextToken;
    mergedTxs.push(...result.transactions);
  } while (nextToken);

  return mergedTxs;
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
