import { NetworkRequestCall } from "@ledgerhq/coin-framework/network";
import { getEnv } from "@ledgerhq/live-env";
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

const fullUrl = (route: string): string =>
  `${INDEXER_URL}${route}?limit=${LIMIT}`;

export const getAccountTransactions =
  (network: NetworkRequestCall) =>
  async (address: string, startAt?: number): Promise<AlgoTransaction[]> => {
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
      const { data }: { data: { transactions: any[] } } = await network({
        method: "GET",
        url: nextUrl,
      });

      // FIXME: what is the correct type? Properly type response from api above (data)
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      nextToken = data["next-token"];
      newRawTxs = data.transactions;
      newRawTxs.map(parseRawTransaction).forEach((tx) => mergedTxs.push(tx));
    } while (newRawTxs.length >= LIMIT);

    return mergedTxs;
  };

const parseRawTransaction = (tx: any): AlgoTransaction => {
  let details: AlgoTransactionDetails | undefined = undefined;
  if (tx["tx-type"] === "pay") {
    const info = tx["payment-transaction"];
    const paymentInfo: AlgoPaymentInfo = {
      amount: new BigNumber(info.amount),
      recipientAddress: info.receiver,
      closeAmount:
        info["close-amount"] === undefined
          ? undefined
          : new BigNumber(info["close-amount"]),
      closeToAddress: info["close-remainder-to"],
    };
    details = paymentInfo;
  } else if (tx["tx-type"] === "axfer") {
    const info = tx["asset-transfer-transaction"];
    const assetTransferInfo: AlgoAssetTransferInfo = {
      assetAmount: new BigNumber(info.amount),
      assetId: info["asset-id"],
      assetRecipientAddress: info.receiver,
      assetSenderAddress: info.sender,
      assetCloseAmount:
        info["close-amount"] === undefined
          ? undefined
          : new BigNumber(info["close-amount"]),
      assetCloseToAddress: tx["close-to"],
    };
    details = assetTransferInfo;
  }

  return {
    id: tx.id,
    timestamp: tx["round-time"],
    round: tx["confirmed-round"],
    senderAddress: tx.sender,
    senderRewards: new BigNumber(tx["sender-rewards"]),
    recipientRewards: new BigNumber(tx["receiver-rewards"]),
    closeRewards:
      tx["close-rewards"] === undefined
        ? undefined
        : new BigNumber(tx["close-rewards"]),
    closeAmount:
      tx["closing-amount"] === undefined
        ? undefined
        : new BigNumber(tx["closing-amount"]),
    fee: new BigNumber(tx.fee),
    note: tx.note,

    type: tx["tx-type"],
    details,
  };
};
