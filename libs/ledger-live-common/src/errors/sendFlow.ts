import { createCustomErrorClass } from "@ledgerhq/errors";

export const TxUnderpriced = createCustomErrorClass<{ url: string }>("TxUnderpriced");
export const AlreadySpentUTXO = createCustomErrorClass<{ url: string }>("AlreadySpendUTXO");
export const TxnMempoolConflict = createCustomErrorClass<{ url: string }>("TxnMempoolConflict");

export const createSendFlowError = (error: Error): Error => {
  const { message } = error;

  if (
    message.includes("-25: bad-tnxs-inputs-missingorspent") ||
    message.includes("-25: Missing inputs")
  )
    return new AlreadySpentUTXO(message, {
      url: "https://support.ledger.com/article/5129526865821-zd",
    });

  if (message.includes("blobs limit in txpool is full"))
    return new TxnMempoolConflict(message, {
      url: "https://support.ledger.com/article/17830974229661-zd",
    });

  if (message.includes("txn-mempool-conflict"))
    return new TxnMempoolConflict(message, {
      url: "https://support.ledger.com/article/14593285242525-zd",
    });

  return error;
};
