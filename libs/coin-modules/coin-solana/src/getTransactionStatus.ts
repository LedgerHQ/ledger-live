import type { AccountBridge } from "@ledgerhq/types-live";
import { BigNumber } from "bignumber.js";
import type {
  Command,
  CommandDescriptor,
  SolanaAccount,
  Transaction,
  TransactionStatus,
} from "./types";
import { assertUnreachable } from "./utils";

export const getTransactionStatus: AccountBridge<
  Transaction,
  SolanaAccount,
  TransactionStatus
>["getTransactionStatus"] = async (_account, tx) => {
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
    case "token.approve":
    case "stake.createAccount":
    case "stake.withdraw":
      return command.amount;
    case "token.createATA":
    case "token.revoke":
    case "stake.delegate":
    case "stake.undelegate":
    case "stake.split":
    case "raw":
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
    case "token.transfer": {
      const transferFee = command.extensions?.transferFee;
      if (transferFee && transferFee.feeBps > 0) {
        return transferFee.transferAmountIncludingFee;
      }

      return Math.max(command.amount, 0);
    }
    case "token.createATA":
    case "token.approve":
    case "token.revoke":
    case "stake.delegate":
    case "stake.undelegate":
    case "stake.withdraw":
    case "stake.split":
    case "raw":
      return fee;
    default:
      return assertUnreachable(command);
  }
}

export default getTransactionStatus;
