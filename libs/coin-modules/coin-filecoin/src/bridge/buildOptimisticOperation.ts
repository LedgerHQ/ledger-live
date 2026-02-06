import { encodeOperationId } from "@ledgerhq/coin-framework/operation";
import { Account, Operation, OperationType } from "@ledgerhq/types-live";
import { toCBORResponse } from "../bridge/serializer";
import { calculateEstimatedFees } from "../bridge/utils";
import { getSubAccount } from "../common-logic/utils";
import { convertAddressEthToFil } from "../network";
import { Transaction } from "../types";

export const buildOptimisticOperation = async (
  account: Account,
  transaction: Transaction,
  serializationRes: toCBORResponse,
  operationType: OperationType = "OUT",
): Promise<Operation> => {
  const type = operationType;
  const subAccount = getSubAccount(account, transaction);
  // resolved at broadcast time
  const txHash = "";
  const { gasFeeCap, gasLimit } = transaction;
  const { parsedSender, recipientToBroadcast, amountToBroadcast: finalAmount } = serializationRes;
  const fee = calculateEstimatedFees(gasFeeCap, gasLimit);

  let operation: Operation;
  if (subAccount) {
    const recipientFilAddr = convertAddressEthToFil(transaction.recipient);
    operation = {
      id: encodeOperationId(subAccount.id, txHash, "OUT"),
      hash: txHash,
      type,
      value: finalAmount,
      fee,
      blockHeight: null,
      blockHash: null,
      accountId: subAccount.id,
      senders: [parsedSender],
      recipients: [recipientFilAddr],
      date: new Date(),
      extra: {},
    };
  } else {
    operation = {
      id: encodeOperationId(account.id, txHash, "OUT"),
      hash: txHash,
      type,
      senders: [parsedSender],
      recipients: [recipientToBroadcast],
      accountId: account.id,
      value: finalAmount.plus(fee),
      fee,
      blockHash: null,
      blockHeight: null,
      date: new Date(),
      extra: {},
    };
  }

  return operation;
};
