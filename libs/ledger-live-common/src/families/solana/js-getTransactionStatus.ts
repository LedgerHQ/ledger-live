import { BigNumber } from "bignumber.js";
import type { Account, TransactionStatus } from "../../types";
import type { Command, CommandDescriptor, Transaction } from "./types";
import { assertUnreachable } from "./utils";

const getTransactionStatus = async (
  _account: Account,
  tx: Transaction
): Promise<TransactionStatus> => {
  const { commandDescriptor } = tx.model;

  if (commandDescriptor === undefined) {
    return {
      amount: tx.amount,
      estimatedFees: new BigNumber(0),
      totalSpent: tx.amount,
      errors: {},
      warnings: {},
    };
  }

  const { command, fee, errors, warnings } = commandDescriptor;

  const amount = new BigNumber(getAmount(command));
  const estimatedFees = new BigNumber(fee);
  const totalSpent = new BigNumber(getTotalSpent(commandDescriptor));

  return {
    amount,
    estimatedFees,
    totalSpent,
    warnings,
    errors,
  };
};

function getAmount(command: Command) {
  switch (command.kind) {
    case "transfer":
    case "token.transfer":
    case "stake.createAccount":
    case "stake.withdraw":
      return command.amount;
    case "token.createATA":
    case "stake.delegate":
    case "stake.undelegate":
    case "stake.split":
      return 0;
    default:
      return assertUnreachable(command);
  }
}

function getTotalSpent({ command, fee }: CommandDescriptor) {
  switch (command.kind) {
    case "transfer":
    case "stake.createAccount":
      return command.amount < 0 ? 0 : command.amount + fee;
    case "token.transfer":
      return Math.max(command.amount, 0);
    case "token.createATA":
    case "stake.delegate":
    case "stake.undelegate":
    case "stake.withdraw":
    case "stake.split":
      return fee;
    default:
      return assertUnreachable(command);
  }
}

export default getTransactionStatus;
