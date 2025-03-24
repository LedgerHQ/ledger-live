import BigNumber from "bignumber.js";
import { OperationType } from "@ledgerhq/types-live";
import { CeloAccount, CeloOperation, CeloOperationMode, Transaction } from "./types";
import { encodeOperationId } from "@ledgerhq/coin-framework/operation";

const MODE_TO_TYPE: { [key in CeloOperationMode | "default"]: OperationType } = {
  send: "OUT",
  lock: "LOCK",
  unlock: "UNLOCK",
  withdraw: "WITHDRAW",
  vote: "VOTE",
  revoke: "REVOKE",
  activate: "ACTIVATE",
  register: "REGISTER",
  default: "FEES",
};

export const buildOptimisticOperation = (
  account: CeloAccount,
  transaction: Transaction,
  fee: BigNumber,
): CeloOperation => {
  const type = MODE_TO_TYPE[transaction.mode] ?? MODE_TO_TYPE.default;

  const value =
    type === "OUT" || type === "LOCK"
      ? new BigNumber(transaction.amount).plus(fee)
      : new BigNumber(transaction.amount);

  const operation: CeloOperation = {
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
    extra: {
      celoOperationValue: new BigNumber(transaction.amount),
      ...(["ACTIVATE", "VOTE", "REVOKE"].includes(type)
        ? {
            celoSourceValidator: transaction.recipient,
          }
        : {}),
    },
  };

  return operation;
};
