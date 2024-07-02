import { Account, Operation, OperationType } from "@ledgerhq/types-live";
import { encodeOperationId } from "@ledgerhq/coin-framework/operation";
import { Transaction } from "./types";
import { toCBORResponse } from "./bridge/utils/serializer";
import { calculateEstimatedFees } from "./utils";
import { convertAddressFilToEthAsync } from "./bridge/utils/addresses";
import { getSubAccount } from "./bridge/utils/utils";

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
    const senderEthAddr = await convertAddressFilToEthAsync(parsedSender);
    const recipientEthAddr = await convertAddressFilToEthAsync(transaction.recipient);
    operation = {
      id: encodeOperationId(subAccount.id, txHash, "OUT"),
      hash: txHash,
      type,
      value: finalAmount,
      fee,
      blockHeight: null,
      blockHash: null,
      accountId: subAccount.id,
      senders: [senderEthAddr],
      recipients: [recipientEthAddr],
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
