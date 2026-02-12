import { encodeOperationId } from "@ledgerhq/coin-framework/operation";
import type { OperationType } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import {
  CommandDescriptor,
  TokenTransferCommand,
  SuiAccount,
  SuiOperation,
  SuiOperationExtra,
  SuiOperationMode,
  Transaction,
} from "../types";
import { assertUnreachable } from "./utils";

const MODE_TO_TYPE: Record<SuiOperationMode | "default", OperationType> = {
  send: "OUT",
  default: "OUT",
};

const getExtra = (type: string, transaction: Transaction): SuiOperationExtra => {
  const extra: SuiOperationExtra = {};

  switch (type) {
    case MODE_TO_TYPE.send:
      return { ...extra, transferAmount: new BigNumber(transaction.amount) };
  }

  return extra;
};

export const buildOptimisticOperation = (
  account: SuiAccount,
  transaction: Transaction,
  fee: BigNumber,
): SuiOperation => {
  const commandDescriptor: CommandDescriptor = {
    command: {
      kind: transaction.mode,
      sender: account.freshAddress,
      recipient: transaction.recipient,
      amount: transaction.amount.toNumber(),
    },
    fee: fee.toNumber(),
    warnings: {},
    errors: {},
  };

  const optimisticOperation = buildOptimisticOperationForCommand(
    account,
    transaction,
    commandDescriptor,
  );

  return optimisticOperation;
};

function buildOptimisticOperationForCommand(
  account: SuiAccount,
  transaction: Transaction,
  commandDescriptor: CommandDescriptor,
): SuiOperation {
  const { command } = commandDescriptor;
  switch (command.kind) {
    case "send":
      return optimisticOpForTransfer(account, transaction, commandDescriptor);
    case "delegate":
      return optimisticOpForStake(account, transaction, commandDescriptor);
    case "undelegate":
      return optimisticOpForUnstake(account, transaction, commandDescriptor);
    case "token.send":
      return optimisticOpForTokenTransfer(account, transaction, command, commandDescriptor);
    default:
      return assertUnreachable(command);
  }
}

function optimisticOpForStake(
  account: SuiAccount,
  transaction: Transaction,
  commandDescriptor: CommandDescriptor,
): SuiOperation {
  const commons = optimisticOpcommons(commandDescriptor);

  return {
    ...commons,
    id: encodeOperationId(account.id, "", "DELEGATE"),
    type: "DELEGATE",
    value: new BigNumber(transaction.amount).plus(commandDescriptor.fee),
    senders: [account.freshAddress],
    recipients: [],
    accountId: account.id,
    date: new Date(),
    extra: {},
  };
}

function optimisticOpForUnstake(
  account: SuiAccount,
  transaction: Transaction,
  commandDescriptor: CommandDescriptor,
): SuiOperation {
  const commons = optimisticOpcommons(commandDescriptor);

  return {
    ...commons,
    id: encodeOperationId(account.id, "", "UNDELEGATE"),
    type: "UNDELEGATE",
    value: new BigNumber(transaction.amount),
    senders: [account.freshAddress],
    recipients: [transaction.recipient].filter(Boolean),
    accountId: account.id,
    date: new Date(),
  };
}

function optimisticOpForTransfer(
  account: SuiAccount,
  transaction: Transaction,
  commandDescriptor: CommandDescriptor,
): SuiOperation {
  const type = MODE_TO_TYPE.default;
  const value = new BigNumber(transaction.amount).plus(commandDescriptor.fee);
  const extra = getExtra(type, transaction);

  const commons = optimisticOpcommons(commandDescriptor);
  return {
    ...commons,
    id: encodeOperationId(account.id, "", type),
    type,
    value,
    senders: [account.freshAddress],
    recipients: [transaction.recipient].filter(Boolean),
    accountId: account.id,
    date: new Date(),
    extra,
  };
}

function optimisticOpForTokenTransfer(
  account: SuiAccount,
  transaction: Transaction,
  _command: TokenTransferCommand,
  commandDescriptor: CommandDescriptor,
): SuiOperation {
  if (!transaction.subAccountId) {
    throw new Error("sub account id is required for token transfer");
  }

  const type = MODE_TO_TYPE.default;
  const value = new BigNumber(transaction.amount);
  const extra = getExtra(type, transaction);

  const commons = optimisticOpcommons(commandDescriptor);
  return {
    ...commons,
    id: encodeOperationId(transaction.subAccountId, "", type),
    type,
    value,
    senders: [account.freshAddress],
    recipients: [transaction.recipient].filter(Boolean),
    accountId: transaction.subAccountId,
    date: new Date(),
    extra,
  };
}

function optimisticOpcommons(commandDescriptor: CommandDescriptor) {
  return {
    hash: "",
    fee: new BigNumber(commandDescriptor.fee),
    blockHash: null,
    blockHeight: null,
    extra: {},
    transactionSequenceNumber: new BigNumber(Date.now()),
  };
}
