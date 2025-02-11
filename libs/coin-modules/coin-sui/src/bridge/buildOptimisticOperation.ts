import BigNumber from "bignumber.js";
import { OperationType } from "@ledgerhq/types-live";
import { encodeOperationId } from "@ledgerhq/coin-framework/operation";
import {
  getNonce,
  //  isFirstBond
} from "./utils";
import {
  PalletMethod,
  SuiAccount,
  SuiOperation,
  SuiOperationExtra,
  SuiOperationMode,
  Transaction,
} from "../types";

const MODE_TO_TYPE: Record<SuiOperationMode | "default", OperationType> = {
  send: "OUT",
  default: "OUT",
};

const MODE_TO_PALLET_METHOD: Record<SuiOperationMode | "sendMax", PalletMethod> = {
  send: "balances.transferKeepAlive",
  sendMax: "balances.transferAllowDeath",
} as const;

const getExtra = (
  type: string,
  account: SuiAccount,
  transaction: Transaction,
): SuiOperationExtra => {
  const extra: SuiOperationExtra = {
    // palletMethod: MODE_TO_PALLET_METHOD[transaction.mode],
    palletMethod: MODE_TO_PALLET_METHOD.send,
  };

  if (transaction.mode == "send" && transaction.useAllAmount) {
    extra.palletMethod = MODE_TO_PALLET_METHOD["sendMax"];
  }

  switch (type) {
    case "OUT":
      return { ...extra, transferAmount: new BigNumber(transaction.amount) };
  }

  return extra;
};

export const buildOptimisticOperation = (
  account: SuiAccount,
  transaction: Transaction,
  fee: BigNumber,
): SuiOperation => {
  // const type = MODE_TO_TYPE[transaction.mode] ?? MODE_TO_TYPE.default;
  const type = MODE_TO_TYPE.default;
  const value = type === "OUT" ? new BigNumber(transaction.amount).plus(fee) : new BigNumber(fee);
  const extra = getExtra(type, account, transaction);
  const operation: SuiOperation = {
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
    transactionSequenceNumber: getNonce(account),
    date: new Date(),
    extra,
  };
  return operation;
};
