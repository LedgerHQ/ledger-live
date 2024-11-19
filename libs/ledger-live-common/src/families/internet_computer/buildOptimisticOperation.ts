import { OperationType } from "@ledgerhq/types-live";
import { encodeOperationId } from "../../operation";
import { InternetComputerOperation } from "./types";
import { getAddress } from "./bridge/bridgeHelpers/addresses";

export const buildOptimisticOperation = async (
  account,
  transaction,
  hash,
  operationType: OperationType = "OUT",
): Promise<InternetComputerOperation> => {
  const { id: accountId } = account;
  const { recipient, amount } = transaction;
  const { address } = getAddress(account);

  return {
    id: encodeOperationId(accountId, hash, operationType),
    hash,
    type: "OUT",
    senders: [address],
    recipients: [recipient],
    accountId,
    value: amount.plus(transaction.fees),
    fee: transaction.fees,
    blockHash: null,
    blockHeight: null,
    date: new Date(),
    extra: {
      memo: transaction.memo,
    },
  };
};
