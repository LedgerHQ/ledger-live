import { Account, Operation, OperationType } from "@ledgerhq/types-live";
import { encodeOperationId } from "@ledgerhq/coin-framework/operation";
import { Transaction } from "./types";
import { toCBOR } from "./bridge/utils/serializer";
import { calculateEstimatedFees } from "./utils";

export const buildOptimisticOperation = (
  account: Account,
  transaction: Transaction,
  operationType: OperationType = "OUT",
): Operation => {
  const { id: accountId } = account;
  // resolved at broadcast time
  const hash = "";
  const { parsedSender, parsedRecipient } = toCBOR(account, transaction);
  const fee = calculateEstimatedFees(transaction.gasFeeCap, transaction.gasLimit);

  return {
    id: encodeOperationId(accountId, hash, operationType),
    hash,
    type: "OUT",
    senders: [parsedSender],
    recipients: [parsedRecipient],
    accountId,
    value: transaction.amount.plus(fee),
    fee,
    blockHash: null,
    blockHeight: null,
    date: new Date(),
    extra: {},
  };
};
