import { createCustomErrorClass } from "@ledgerhq/errors";

export const TransactionBroadcastError = createCustomErrorClass<{ url?: string } & TxData>(
  "TransactionBroadcastError",
);

export interface TransactionBroadcastError extends Error, TxData {
  url?: string;
}

export const createTransactionBroadcastError = (
  error: Error,
  data: TxData,
): TransactionBroadcastError => {
  return new TransactionBroadcastError(error.message, { url: url(error.message), ...data });
};

function url(message: string) {
  if (
    message.includes("-25: bad-tnxs-inputs-missingorspent") ||
    message.includes("-25: Missing inputs")
  ) {
    return "https://support.ledger.com/article/5129526865821-zd";
  }

  if (message.includes("blobs limit in txpool is full")) {
    return "https://support.ledger.com/article/17830974229661-zd";
  }

  if (message.includes("txn-mempool-conflict")) {
    return "https://support.ledger.com/article/14593285242525-zd";
  }
}

type TxData = { coin?: string; network?: string };
