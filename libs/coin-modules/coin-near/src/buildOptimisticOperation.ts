import BigNumber from "bignumber.js";
import { encodeOperationId } from "@ledgerhq/coin-framework/operation";
import { Account, Operation, OperationType } from "@ledgerhq/types-live";
import { Transaction } from "./types";

export const buildOptimisticOperation = (
  account: Account,
  transaction: Transaction,
  fee: BigNumber,
): Operation => {
  let type: OperationType;
  let value = new BigNumber(transaction.amount);

  switch (transaction.mode) {
    case "stake":
      type = "STAKE";
      break;
    case "unstake":
      type = "UNSTAKE";
      break;
    case "withdraw":
      type = "WITHDRAW_UNSTAKED";
      break;
    default:
      value = value.plus(fee);
      type = "OUT";
  }

  const operation: Operation = {
    id: encodeOperationId(account.id, "", type),
    hash: "",
    type,
    value,
    fee,
    blockHash: null,
    blockHeight: null,
    senders: [account.freshAddress],
    recipients: [transaction.recipient].filter(Boolean),
    accountId: account.id,
    date: new Date(),
    extra: {},
  };

  return operation;
};
