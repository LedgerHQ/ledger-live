import { BigNumber } from "bignumber.js";
import type { Account, TransactionStatus } from "../../types";
import type { Command, Transaction, TransactionModel } from "./types";
import { assertUnreachable } from "./utils";

const getTransactionStatus = async (
  account: Account,
  tx: Transaction
): Promise<TransactionStatus> => {
  const txFees = new BigNumber(tx.feeCalculator?.lamportsPerSignature ?? 0);

  const { commandDescriptor } = tx.model;

  if (commandDescriptor === undefined) {
    const amount = getAmountForModel(account, tx, txFees);
    const totalSpent = getTotalSpentForModel(tx.model, amount, txFees);
    return {
      amount,
      errors: {},
      warnings: {},
      estimatedFees: txFees,
      totalSpent,
    };
  }
  switch (commandDescriptor.status) {
    case "invalid": {
      const amount = getAmountForModel(account, tx, txFees);
      const totalSpent = getTotalSpentForModel(tx.model, amount, txFees);
      return {
        amount,
        errors: commandDescriptor.errors,
        warnings: commandDescriptor.warnings ?? {},
        estimatedFees: txFees,
        totalSpent,
      };
    }
    case "valid": {
      const { command } = commandDescriptor;
      const estimatedFees = txFees.plus(commandDescriptor.fees ?? 0);
      const amount = getAmountForCommand(command);
      const totalSpent = getTotalSpentForCommand(
        command,
        amount,
        estimatedFees
      );

      return {
        amount,
        estimatedFees,
        totalSpent,
        warnings: commandDescriptor.warnings ?? {},
        errors: {},
      };
    }
    default:
      return assertUnreachable(commandDescriptor);
  }
};

function getAmountForModel(
  account: Account,
  tx: Transaction,
  estimatedFees: BigNumber
) {
  const { model } = tx;
  switch (model.kind) {
    case "transfer": {
      if (tx.amount.lte(0)) {
        return tx.amount;
      }
      const amount = tx.useAllAmount
        ? account.balance.minus(estimatedFees)
        : BigNumber.max(tx.amount, 0);
      return amount.gte(0) ? amount : account.balance;
    }
    case "token.transfer":
      return tx.useAllAmount ? account.balance : tx.amount;
    case "token.createATA":
      return new BigNumber(0);
    default:
      return assertUnreachable(model);
  }
}

function getTotalSpentForModel(
  model: TransactionModel,
  amount: BigNumber,
  estimatedFees: BigNumber
) {
  switch (model.kind) {
    case "transfer":
      return amount.plus(estimatedFees);
    case "token.transfer":
      return amount;
    case "token.createATA":
      return estimatedFees;
    default:
      return assertUnreachable(model);
  }
}

function getAmountForCommand(command: Command) {
  switch (command.kind) {
    case "transfer":
    case "token.transfer":
      return new BigNumber(command.amount);
    case "token.createATA":
      return new BigNumber(0);
    default:
      return assertUnreachable(command);
  }
}

function getTotalSpentForCommand(
  command: Command,
  amount: BigNumber,
  estimatedFees: BigNumber
) {
  switch (command.kind) {
    case "transfer":
      return amount.plus(estimatedFees);
    case "token.transfer":
      return amount;
    case "token.createATA":
      return estimatedFees;
    default:
      return assertUnreachable(command);
  }
}

export default getTransactionStatus;
