import { Account, OperationType } from "@ledgerhq/types-live";
import { encodeOperationId } from "@ledgerhq/coin-framework/operation";
import { InternetComputerOperation, Transaction } from "../types";
import { getAddress } from "./bridgeHelpers/addresses";

export const buildOptimisticOperation = async (
  account: Account,
  transaction: Transaction,
  hash: string,
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
