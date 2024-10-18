import { createCustomErrorClass } from "@ledgerhq/errors";

export const TransactionBroadcastError = createCustomErrorClass<{ url: string }>(
  "TransactionBroadcastError",
);

interface CustomError extends Error {
  url?: string;
}

export const createTransactionBroadcastError = (error: Error): CustomError => {
  const { message } = error;

  if (
    message.includes("-25: bad-tnxs-inputs-missingorspent") ||
    message.includes("-25: Missing inputs")
  ) {
    return new TransactionBroadcastError(message, {
      url: "https://support.ledger.com/article/5129526865821-zd",
    });
  }

  if (message.includes("blobs limit in txpool is full")) {
    return new TransactionBroadcastError(message, {
      url: "https://support.ledger.com/article/17830974229661-zd",
    });
  }

  if (message.includes("txn-mempool-conflict")) {
    return new TransactionBroadcastError(message, {
      url: "https://support.ledger.com/article/14593285242525-zd",
    });
  }

  return new TransactionBroadcastError(message);
};
