import BigNumber from "bignumber.js";
import type { Account, OperationType } from "@ledgerhq/types-live";
import { encodeOperationId } from "@ledgerhq/coin-framework/operation";
import { getNonce } from "./utils";
import {
  CommandDescriptor,
  TransferCommand,
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

const getExtra = (
  type: string,
  _account: SuiAccount,
  transaction: Transaction,
): SuiOperationExtra => {
  const extra: SuiOperationExtra = {};

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
  const commandDescriptor: CommandDescriptor = {
    command: {
      kind: "transfer" as const,
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
  account: Account,
  transaction: Transaction,
  commandDescriptor: CommandDescriptor,
): SuiOperation {
  const { command } = commandDescriptor;
  switch (command.kind) {
    case "transfer":
      return optimisticOpForTransfer(account, transaction, command, commandDescriptor);
    default:
      // @ts-expect-error TODO: fix type
      return assertUnreachable(command);
  }
}

function optimisticOpForTransfer(
  account: Account,
  transaction: Transaction,
  _command: TransferCommand,
  commandDescriptor: CommandDescriptor,
): SuiOperation {
  const type = MODE_TO_TYPE.default;
  const value =
    type === "OUT"
      ? new BigNumber(transaction.amount).plus(commandDescriptor.fee)
      : new BigNumber(commandDescriptor.fee);
  const extra = getExtra(type, account, transaction);

  const commons = optimisticOpcommons(commandDescriptor);
  return {
    ...commons,
    id: encodeOperationId(account.id, "", type),
    type,
    value,
    senders: [account.freshAddress],
    recipients: [transaction.recipient].filter(Boolean),
    accountId: account.id,
    transactionSequenceNumber: getNonce(account),
    date: new Date(), // TODO: use transaction date
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
  };
}
