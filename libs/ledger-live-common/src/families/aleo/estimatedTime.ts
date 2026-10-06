import { SINGLE_CALL_SIGNING_TIME } from "./constants";
import type { Transaction } from "./types";
import { isPrivateTransaction } from "./utils";

export const ESTIMATED_TIME_LEARN_MORE_URL = "https://support.ledger.com/article/Aleo-ALEO";

function getSignedCallCount(transaction: Transaction): number {
  if (!isPrivateTransaction(transaction)) return 1;

  const { amountRecordCommitments, feeRecordCommitment } = transaction.properties;
  const recordCount = amountRecordCommitments.length + (feeRecordCommitment ? 1 : 0);
  return Math.max(recordCount, 1);
}

export function getEstimatedSendTimeMs(transaction: Transaction): number {
  return getSignedCallCount(transaction) * SINGLE_CALL_SIGNING_TIME;
}
