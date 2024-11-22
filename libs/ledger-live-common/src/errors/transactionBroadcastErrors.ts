import { createCustomErrorClass } from "@ledgerhq/errors";

export const TransactionBroadcastError = createCustomErrorClass<{ url?: string } & TxData>(
  "TransactionBroadcastError",
);

export interface TransactionBroadcastError extends Error, TxData {
  url?: string;
}

export const createTransactionBroadcastError = (
  error: Error,
  urls: { faq: string; txBroadcastErrors: Record<SpecificErrors, string> },
  data: TxData,
): TransactionBroadcastError => {
  return new TransactionBroadcastError(error.message, {
    url: url(error.message, urls.txBroadcastErrors) ?? urls.faq,
    ...data,
  });
};

function url(message: string, urls: Record<SpecificErrors, string>) {
  if (
    message.includes("-25: bad-tnxs-inputs-missingorspent") ||
    message.includes("-25: Missing inputs")
  ) {
    return urls.badTxns;
  }

  if (message.includes("blobs limit in txpool is full")) {
    return urls.blobsLimit;
  }

  if (message.includes("txn-mempool-conflict")) {
    return urls.txnMempoolConflict;
  }
}

type TxData = { coin?: string; network?: string };
type SpecificErrors = "badTxns" | "blobsLimit" | "txnMempoolConflict";
