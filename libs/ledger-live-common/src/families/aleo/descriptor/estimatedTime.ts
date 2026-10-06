import type { EstimatedTimeDescriptor } from "../../../bridge/descriptor/types";
import { SINGLE_CALL_SIGNING_TIME } from "../constants";
import { isPrivateTransaction } from "../utils";
import { isAleoTransaction } from "./balanceType";

const ALEO_LEARN_MORE_URL = "https://support.ledger.com/article/Aleo-ALEO";

function getSignedCallCount(transaction: unknown): number | null {
  if (!isAleoTransaction(transaction)) return null;
  if (!isPrivateTransaction(transaction)) return 1;

  const { amountRecordCommitments, feeRecordCommitment } = transaction.properties;
  const recordCount = amountRecordCommitments.length + (feeRecordCommitment ? 1 : 0);
  return Math.max(recordCount, 1);
}

export const estimatedTime: EstimatedTimeDescriptor = {
  getEstimatedMs: transaction => {
    const callCount = getSignedCallCount(transaction);
    return callCount === null ? null : callCount * SINGLE_CALL_SIGNING_TIME;
  },
  translationKey: "estimatedTime.aleo",
  learnMoreUrl: ALEO_LEARN_MORE_URL,
};
