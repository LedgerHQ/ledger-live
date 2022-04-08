import { BigNumber } from "bignumber.js";
import type {
  Command,
  TokenCreateATACommand,
  TokenTransferCommand,
  Transaction,
  TransactionRaw,
  TransferCommand,
} from "./types";
import {
  fromTransactionCommonRaw,
  toTransactionCommonRaw,
} from "../../transaction/common";
import type { Account } from "../../types";
import { findSubAccountById, getAccountUnit } from "../../account";
import { formatCurrencyUnit, getTokenById } from "../../currencies";
import { assertUnreachable } from "./utils";
import { toTokenId } from "./logic";

export const fromTransactionRaw = (tr: TransactionRaw): Transaction => {
  const common = fromTransactionCommonRaw(tr);
  const { family, model, feeCalculator } = tr;
  return {
    ...common,
    family,
    model: JSON.parse(model),
    feeCalculator,
  };
};

export const toTransactionRaw = (t: Transaction): TransactionRaw => {
  const common = toTransactionCommonRaw(t);
  const { family, model, feeCalculator } = t;
  return {
    ...common,
    family,
    model: JSON.stringify(model),
    feeCalculator,
  };
};

const lamportsToSOL = (account: Account, amount: number) => {
  return formatCurrencyUnit(getAccountUnit(account), new BigNumber(amount), {
    showCode: true,
    disableRounding: true,
  });
};

export const formatTransaction = (
  tx: Transaction,
  mainAccount: Account
): string => {
  if (tx.model.commandDescriptor === undefined) {
    throw new Error("can not format unprepared transaction");
  }
  const { commandDescriptor } = tx.model;
  switch (commandDescriptor.status) {
    case "valid":
      return formatCommand(mainAccount, tx, commandDescriptor.command);
    case "invalid":
      throw new Error("can not format invalid transaction");
    default:
      return assertUnreachable(commandDescriptor);
  }
};

function formatCommand(
  mainAccount: Account,
  tx: Transaction,
  command: Command
) {
  switch (command.kind) {
    case "transfer":
      return formatTransfer(mainAccount, tx, command);
    case "token.transfer":
      return formatTokenTransfer(mainAccount, tx, command);
    case "token.createATA":
      return formatCreateATA(mainAccount, tx, command);
    default:
      return assertUnreachable(command);
  }
}

function formatTransfer(
  mainAccount: Account,
  tx: Transaction,
  command: TransferCommand
) {
  const amount = lamportsToSOL(mainAccount, command.amount);
  const str = [
    `  SEND: ${amount}${tx.useAllAmount ? " (ALL)" : ""}`,
    `  TO: ${command.recipient}`,
    command.memo ? `  MEMO: ${command.memo}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  return "\n" + str;
}

function formatTokenTransfer(
  mainAccount: Account,
  tx: Transaction,
  command: TokenTransferCommand
) {
  if (!tx.subAccountId) {
    throw new Error("expected subaccountId on transaction");
  }
  const subAccount = findSubAccountById(mainAccount, tx.subAccountId);
  if (!subAccount || subAccount.type !== "TokenAccount") {
    throw new Error("token subaccount expected");
  }
  const amount = formatCurrencyUnit(
    getAccountUnit(subAccount),
    new BigNumber(command.amount),
    {
      showCode: true,
      disableRounding: true,
    }
  );
  const recipient = command.recipientDescriptor.walletAddress;
  const str = [
    `  SEND: ${amount}${tx.useAllAmount ? " (ALL)" : ""}`,
    `  TO: ${recipient}`,
    command.memo ? `  MEMO: ${command.memo}` : "",
  ]
    .filter(Boolean)
    .join("\n");
  return "\n" + str;
}

function formatCreateATA(
  mainAccount: Account,
  tx: Transaction,
  command: TokenCreateATACommand
) {
  const token = getTokenById(toTokenId(command.mint));
  const str = [`  OPT IN TOKEN: ${token.ticker}`].filter(Boolean).join("\n");
  return "\n" + str;
}

export default {
  formatTransaction,
  fromTransactionRaw,
  toTransactionRaw,
};
