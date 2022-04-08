import type { AccountLike, Account } from "../../types";
import type {
  TokenCreateATACommand,
  TokenTransferCommand,
  Transaction,
  TransferCommand,
  ValidCommandDescriptor,
} from "./types";
import type { DeviceTransactionField } from "../../transaction";
import { assertUnreachable } from "./utils";

// do not show fields like 'To', 'Recipient', etc., as per Ledger policy

function getDeviceTransactionConfig({
  transaction,
}: {
  account: AccountLike;
  parentAccount: Account | null | undefined;
  transaction: Transaction;
}): Array<DeviceTransactionField> {
  const { commandDescriptor } = transaction.model;
  if (commandDescriptor === undefined) {
    throw new Error("missing command descriptor");
  }
  switch (commandDescriptor.status) {
    case "valid":
      return fieldsForCommand(commandDescriptor);
    case "invalid":
      throw new Error("unexpected invalid command");
    default:
      return assertUnreachable(commandDescriptor);
  }
}

export default getDeviceTransactionConfig;
function fieldsForCommand(
  commandDescriptor: ValidCommandDescriptor
): DeviceTransactionField[] {
  const { command } = commandDescriptor;
  switch (command.kind) {
    case "transfer":
      return fieldsForTransfer(command);
    case "token.transfer":
      return fieldsForTokenTransfer(command);
    case "token.createATA":
      return fieldsForCreateATA(command);
    default:
      return assertUnreachable(command);
  }
}

function fieldsForTransfer(command: TransferCommand): DeviceTransactionField[] {
  const fields: Array<DeviceTransactionField> = [];

  fields.push({
    type: "amount",
    label: "Transfer",
  });

  fields.push({
    type: "address",
    address: command.sender,
    label: "Sender",
  });

  fields.push({
    type: "text",
    label: "Fee payer",
    value: "Sender",
  });

  return fields;
}
function fieldsForTokenTransfer(
  command: TokenTransferCommand
): DeviceTransactionField[] {
  const fields: Array<DeviceTransactionField> = [];

  if (command.recipientDescriptor.shouldCreateAsAssociatedTokenAccount) {
    fields.push({
      type: "address",
      label: "Create token acct",
      address: command.recipientDescriptor.tokenAccAddress,
    });

    fields.push({
      type: "address",
      label: "From mint",
      address: command.mintAddress,
    });
    fields.push({
      type: "address",
      label: "Funded by",
      address: command.ownerAddress,
    });
  }

  fields.push({
    type: "amount",
    label: "Transfer tokens",
  });

  fields.push({
    type: "address",
    address: command.ownerAssociatedTokenAccountAddress,
    label: "From",
  });

  fields.push({
    type: "address",
    address: command.ownerAddress,
    label: "Owner",
  });

  fields.push({
    type: "address",
    address: command.ownerAddress,
    label: "Fee payer",
  });

  return fields;
}

function fieldsForCreateATA(
  command: TokenCreateATACommand
): DeviceTransactionField[] {
  const fields: Array<DeviceTransactionField> = [];

  fields.push({
    type: "address",
    label: "Create token acct",
    address: command.associatedTokenAccountAddress,
  });

  fields.push({
    type: "address",
    label: "From mint",
    address: command.mint,
  });

  fields.push({
    type: "address",
    label: "Owned by",
    address: command.owner,
  });

  fields.push({
    type: "address",
    label: "Funded by",
    address: command.owner,
  });

  fields.push({
    type: "address",
    label: "Fee payer",
    address: command.owner,
  });

  return fields;
}
