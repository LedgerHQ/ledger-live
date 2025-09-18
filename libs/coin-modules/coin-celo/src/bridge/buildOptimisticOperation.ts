import BigNumber from "bignumber.js";
import { OperationType } from "@ledgerhq/types-live";
import { CeloAccount, CeloOperation, CeloOperationMode, Transaction } from "../types";
import { encodeOperationId } from "@ledgerhq/coin-framework/operation";
import { findSubAccountById } from "@ledgerhq/coin-framework/account/index";

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

  const tokenAccount = findSubAccountById(account, transaction.subAccountId || "");
  const isTokenTransaction = tokenAccount?.type === "TokenAccount";

  const value =
    type === "OUT" || type === "LOCK"
      ? new BigNumber(transaction.amount).plus(isTokenTransaction ? 0 : fee)
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
    accountId: isTokenTransaction ? tokenAccount.id : account.id,
    date: new Date(),
    extra: {
      ...(["ACTIVATE", "VOTE", "REVOKE"].includes(type)
        ? {
            celoOperationValue: new BigNumber(transaction.amount),
            celoSourceValidator: transaction.recipient,
          }
        : {}),
    },
  };

  return operation;
};
