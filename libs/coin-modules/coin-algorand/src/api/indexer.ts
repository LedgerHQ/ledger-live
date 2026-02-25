import { getEnv } from "@ledgerhq/live-env";
import network from "@ledgerhq/live-network";
import { BigNumber } from "bignumber.js";
import {
  AlgoAssetTransferInfo,
  AlgoPaymentInfo,
  AlgoTransaction,
  AlgoTransactionDetails,
} from "./indexer.types";

const LIMIT = 100; // Max nb of transactions per request

const BASE_URL = getEnv("API_ALGORAND_BLOCKCHAIN_EXPLORER_API_ENDPOINT");
const INDEXER_URL = `${BASE_URL}/idx2/v2`;

const fullUrl = (route: string): string => `${INDEXER_URL}${route}?limit=${LIMIT}`;

type ExplorerTransactions = {
  "current-round": number;
  "next-token": string;
  transactions: ExplorerTransaction[];
};

type ExplorerTransaction = {
  "application-transaction"?: {
    accounts: string[];
    "application-args": string[];
    "application-id": number;
    "foreign-apps": unknown[];
    "foreign-assets": number[];
    "global-state-schema": {
      "num-byte-slice": number;
      "num-uint": number;
    };
    "local-state-schema": {
      "num-byte-slice": number;
      "num-uint": number;
    };
    "on-completion": string;
  };
  "asset-transfer-transaction"?: {
    amount: number;
    "asset-id": number;
    "close-amount": number;
    "close-to"?: string;
    receiver: string;
  };
  "close-rewards": number;
  "closing-amount": number;
  "confirmed-round": number;
  fee: number;
  "first-valid": number;
  "genesis-hash": string;
  "genesis-id": string;
  "global-state-delta": {
    key: string;
    value: {
      action: number;
      uint: number;
      bytes?: string;
    };
  }[];
  id: string;
  "intra-round-offset": number;
  "last-valid": number;
  "local-state-delta": {
    address: string;
    delta: {
      key: string;
      value: {
        action: number;
        uint: number;
      };
    }[];
  }[];
  note: string;
  "payment-transaction"?: {
    amount: number;
    "close-amount": number;
    "close-remainder-to"?: string;
    receiver: string;
  };
  "receiver-rewards": number;
  "round-time": number;
  sender: string;
  "sender-rewards": number;
  signature: {
    sig: string;
  };
  "tx-type": string;
};

export const getAccountTransactions = async (
  address: string,
  startAt?: number,
): Promise<AlgoTransaction[]> => {
  const url = fullUrl(`/accounts/${address}/transactions`);

  let nextToken: string | undefined;
  let newRawTxs: any[] = [];
  const mergedTxs: AlgoTransaction[] = [];
  do {
    let nextUrl: string = url;
    if (startAt) {
      nextUrl = nextUrl.concat(`&min-round=${startAt}`);
    }
    if (nextToken) {
      nextUrl = nextUrl.concat(`&next=${nextToken}`);
    }
    const { data }: { data: { transactions: any[] } } = await network<ExplorerTransactions>({
      url: nextUrl,
    });

    // FIXME: what is the correct type? Properly type response from api above (data)
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    nextToken = data["next-token"];
    newRawTxs = data.transactions;
    newRawTxs.map(parseRawTransaction).forEach(tx => mergedTxs.push(tx));
  } while (newRawTxs.length >= LIMIT);

  return mergedTxs;
};

const parseRawTransaction = (tx: ExplorerTransaction): AlgoTransaction => {
  let details: AlgoTransactionDetails | undefined = undefined;
  if (tx["tx-type"] === "pay") {
    // If "tx-type" is "pay", we know we received a "payment-transaction"
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
    // If "tx-type" is "axfer", we know we received a "asset-transfer-transaction"
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
