import { BigNumber } from "bignumber.js";
import type {
  Command,
  StakeCreateAccountCommand,
  StakeDelegateCommand,
  StakeSplitCommand,
  StakeUndelegateCommand,
  StakeWithdrawCommand,
  TokenCreateATACommand,
  TokenTransferCommand,
  TokenCreateApproveCommand,
  TokenCreateRevokeCommand,
  Transaction,
  TransactionRaw,
  TransferCommand,
} from "./types";
import { formatTransactionStatus } from "@ledgerhq/coin-framework/formatters";
import {
  fromTransactionCommonRaw,
  fromTransactionStatusRawCommon as fromTransactionStatusRaw,
  toTransactionCommonRaw,
  toTransactionStatusRawCommon as toTransactionStatusRaw,
} from "@ledgerhq/coin-framework/serialization";
import type { Account } from "@ledgerhq/types-live";
import { findTokenByAddressInCurrency } from "@ledgerhq/cryptoassets/index";
import { findSubAccountById, getAccountCurrency } from "@ledgerhq/coin-framework/account";
import { formatCurrencyUnit } from "@ledgerhq/coin-framework/currencies";
import { assertUnreachable } from "./utils";

export const fromTransactionRaw = (tr: TransactionRaw): Transaction => {
  const common = fromTransactionCommonRaw(tr);
  const { family, model } = tr;
  return {
    ...common,
    family,
    model: JSON.parse(model),
  };
};

export const toTransactionRaw = (t: Transaction): TransactionRaw => {
  const common = toTransactionCommonRaw(t);
  const { family, model } = t;
  return {
    ...common,
    family,
    model: JSON.stringify(model),
  };
};

const lamportsToSOL = (account: Account, amount: number) => {
  return formatCurrencyUnit(getAccountCurrency(account).units[0], new BigNumber(amount), {
    showCode: true,
    disableRounding: true,
  });
};

export const formatTransaction = (tx: Transaction, mainAccount: Account): string => {
  if (tx.model.commandDescriptor === undefined) {
    throw new Error("can not format unprepared transaction");
  }
  const { commandDescriptor } = tx.model;

  if (Object.keys(commandDescriptor.errors).length > 0) {
    throw new Error("can not format invalid transaction");
  }
  return formatCommand(mainAccount, tx, commandDescriptor.command);
};

function formatCommand(mainAccount: Account, tx: Transaction, command: Command) {
  switch (command.kind) {
    case "transfer":
      return formatTransfer(mainAccount, tx, command);
    case "token.transfer":
      return formatTokenTransfer(mainAccount, tx, command);
    case "token.createATA":
      return formatCreateATA(mainAccount, command);
    case "token.approve":
      return formatCreateApprove(mainAccount, tx, command);
    case "token.revoke":
      return formatCreateRevoke(mainAccount, tx, command);
    case "stake.createAccount":
      return formatStakeCreateAccount(mainAccount, tx, command);
    case "stake.delegate":
      return formatStakeDelegate(command);
    case "stake.undelegate":
      return formatStakeUndelegate(command);
    case "stake.withdraw":
      return formatStakeWithdraw(mainAccount, tx, command);
    case "stake.split":
      return formatStakeSplit(mainAccount, tx, command);
    default:
      return assertUnreachable(command);
  }
}

function formatStakeCreateAccount(
  mainAccount: Account,
  tx: Transaction,
  command: StakeCreateAccountCommand,
) {
  const amount = lamportsToSOL(mainAccount, command.amount + command.stakeAccRentExemptAmount);
  const str = [
    `  CREATE STAKE ACCOUNT: ${command.stakeAccAddress}`,
    `  FROM: ${command.fromAccAddress}`,
    `  AMOUNT: ${amount}${tx.useAllAmount ? " (ALL)" : ""}`,
    `  SEED: ${command.seed}`,
    `  VALIDATOR: ${command.delegate.voteAccAddress}`,
  ]
    .filter(Boolean)
    .join("\n");

  return "\n" + str;
}

function formatTransfer(mainAccount: Account, tx: Transaction, command: TransferCommand) {
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

function formatTokenTransfer(mainAccount: Account, tx: Transaction, command: TokenTransferCommand) {
  if (!tx.subAccountId) {
    throw new Error("expected subaccountId on transaction");
  }
  const subAccount = findSubAccountById(mainAccount, tx.subAccountId);
  if (!subAccount || subAccount.type !== "TokenAccount") {
    throw new Error("token subaccount expected");
  }
  const amount = formatCurrencyUnit(
    getAccountCurrency(subAccount).units[0],
    new BigNumber(command.amount),
    {
      showCode: true,
      disableRounding: true,
    },
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

function formatCreateATA(mainAccount: Account, command: TokenCreateATACommand) {
  const token = findTokenByAddressInCurrency(command.mint, mainAccount.currency.id);
  if (!token) {
    throw new Error(`token for mint "${command.mint}" not found`);
  }
  const str = [`  OPT IN TOKEN: ${token.ticker}`].filter(Boolean).join("\n");
  return "\n" + str;
}

function formatCreateApprove(
  mainAccount: Account,
  tx: Transaction,
  command: TokenCreateApproveCommand,
) {
  if (!tx.subAccountId) {
    throw new Error("expected subaccountId on transaction");
  }
  const subAccount = findSubAccountById(mainAccount, tx.subAccountId);
  if (!subAccount || subAccount.type !== "TokenAccount") {
    throw new Error("token subaccount expected");
  }
  const amount = formatCurrencyUnit(
    getAccountCurrency(subAccount).units[0],
    new BigNumber(command.amount),
    {
      showCode: true,
      disableRounding: true,
    },
  );
  const str = [
    `  OWNER: ${command.owner}`,
    `  APPROVE: ${command.account}`,
    `  DELEGATE: ${command.recipientDescriptor.walletAddress}`,
    `  AMOUNT: ${amount}${tx.useAllAmount ? " (ALL)" : ""}`,
  ]
    .filter(Boolean)
    .join("\n");
  return "\n" + str;
}

function formatCreateRevoke(
  mainAccount: Account,
  tx: Transaction,
  command: TokenCreateRevokeCommand,
) {
  if (!tx.subAccountId) {
    throw new Error("expected subaccountId on transaction");
  }
  const subAccount = findSubAccountById(mainAccount, tx.subAccountId);
  if (!subAccount || subAccount.type !== "TokenAccount") {
    throw new Error("token subaccount expected");
  }

  const str = [`  OWNER: ${command.owner}`, `  REVOKE: ${command.account}`]
    .filter(Boolean)
    .join("\n");
  return "\n" + str;
}

function formatStakeDelegate(command: StakeDelegateCommand) {
  const str = [`  DELEGATE: ${command.stakeAccAddr}`, `  TO: ${command.voteAccAddr}`]
    .filter(Boolean)
    .join("\n");
  return "\n" + str;
}

function formatStakeUndelegate(command: StakeUndelegateCommand) {
  const str = [`  UNDELEGATE: ${command.stakeAccAddr}`].filter(Boolean).join("\n");
  return "\n" + str;
}

function formatStakeWithdraw(mainAccount: Account, tx: Transaction, command: StakeWithdrawCommand) {
  const amount = lamportsToSOL(mainAccount, command.amount);
  const str = [
    `  WITHDRAW FROM: ${command.stakeAccAddr}`,
    `  AMOUNT: ${amount}${tx.useAllAmount ? " (ALL)" : ""}`,
    `  TO: ${command.toAccAddr}`,
  ]
    .filter(Boolean)
    .join("\n");
  return "\n" + str;
}

function formatStakeSplit(mainAccount: Account, tx: Transaction, command: StakeSplitCommand) {
  const amount = lamportsToSOL(mainAccount, command.amount);
  const str = [
    `  SPLIT: ${command.stakeAccAddr}`,
    `  AMOUNT: ${amount}${tx.useAllAmount ? " (ALL)" : ""}`,
    `  TO: ${command.splitStakeAccAddr}`,
  ]
    .filter(Boolean)
    .join("\n");
  return "\n" + str;
}

export default {
  formatTransaction,
  fromTransactionRaw,
  toTransactionRaw,
  fromTransactionStatusRaw,
  toTransactionStatusRaw,
  formatTransactionStatus,
};
