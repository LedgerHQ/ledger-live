import BigNumber from "bignumber.js";
import { formatCurrencyUnit } from "../../currencies";
import type { DeviceTransactionField } from "../../transaction";
import type { Account, AccountLike } from "../../types";
import type {
  CommandDescriptor,
  StakeCreateAccountCommand,
  StakeDelegateCommand,
  StakeSplitCommand,
  StakeUndelegateCommand,
  StakeWithdrawCommand,
  TokenCreateATACommand,
  TokenTransferCommand,
  Transaction,
  TransferCommand,
} from "./types";
import { assertUnreachable } from "./utils";

// do not show fields like 'To', 'Recipient', etc., as per Ledger policy

function getDeviceTransactionConfig({
  account,
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
  if (Object.keys(commandDescriptor.errors).length > 0) {
    throw new Error("unexpected invalid command");
  }

  return fieldsForCommand(commandDescriptor, account);
}

export default getDeviceTransactionConfig;

function fieldsForCommand(
  commandDescriptor: CommandDescriptor,
  account: AccountLike
): DeviceTransactionField[] {
  const { command } = commandDescriptor;
  switch (command.kind) {
    case "transfer":
      return fieldsForTransfer(command);
    case "token.transfer":
      return fieldsForTokenTransfer(command);
    case "token.createATA":
      return fieldsForCreateATA(command);
    case "stake.createAccount":
      return fieldsForStakeCreateAccount(command, account);
    case "stake.delegate":
      return fieldsForStakeDelegate(command);
    case "stake.undelegate":
      return fieldsForStakeUndelegate(command);
    case "stake.withdraw":
      return fieldsForStakeWithdraw(command);
    case "stake.split":
      return fieldsForStakeSplit(command);
    default:
      return assertUnreachable(command);
  }
}

function fieldsForTransfer(
  _command: TransferCommand
): DeviceTransactionField[] {
  const fields: Array<DeviceTransactionField> = [];

  fields.push({
    type: "amount",
    label: "Transfer",
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
function fieldsForStakeCreateAccount(
  command: StakeCreateAccountCommand,
  account: AccountLike
): DeviceTransactionField[] {
  if (account.type !== "Account") {
    throw new Error("unsupported account type");
  }

  const unit = account.currency.units[0];

  const fields: Array<DeviceTransactionField> = [];

  fields.push({
    type: "address",
    label: "Delegate from",
    address: command.stakeAccAddress,
  });

  // not using 'amount' field here because the field should
  // show sum of amount and rent exempt amount
  fields.push({
    type: "text",
    label: "Deposit",
    value: formatCurrencyUnit(
      unit,
      new BigNumber(command.amount + command.stakeAccRentExemptAmount),
      {
        disableRounding: true,
        showCode: true,
      }
    ),
  });

  fields.push({
    type: "address",
    label: "New authority",
    address: command.fromAccAddress,
  });

  fields.push({
    type: "address",
    label: "Vote account",
    address: command.delegate.voteAccAddress,
  });

  return fields;
}

function fieldsForStakeDelegate(
  command: StakeDelegateCommand
): DeviceTransactionField[] {
  const fields: Array<DeviceTransactionField> = [];

  fields.push({
    type: "address",
    label: "Delegate from",
    address: command.stakeAccAddr,
  });

  fields.push({
    type: "address",
    label: "Vote account",
    address: command.voteAccAddr,
  });

  return fields;
}

function fieldsForStakeUndelegate(
  command: StakeUndelegateCommand
): DeviceTransactionField[] {
  const fields: Array<DeviceTransactionField> = [];

  fields.push({
    type: "address",
    label: "Deactivate stake",
    address: command.stakeAccAddr,
  });

  return fields;
}

function fieldsForStakeWithdraw(
  command: StakeWithdrawCommand
): DeviceTransactionField[] {
  const fields: Array<DeviceTransactionField> = [];

  fields.push({
    type: "amount",
    label: "Stake withdraw",
  });

  fields.push({
    type: "address",
    label: "From",
    address: command.stakeAccAddr,
  });

  return fields;
}

function fieldsForStakeSplit(
  command: StakeSplitCommand
): DeviceTransactionField[] {
  const fields: Array<DeviceTransactionField> = [];

  fields.push({
    type: "amount",
    label: "Split stake",
  });

  fields.push({
    type: "address",
    label: "From",
    address: command.stakeAccAddr,
  });

  fields.push({
    type: "address",
    label: "To",
    address: command.splitStakeAccAddr,
  });

  fields.push({
    type: "address",
    label: "Base",
    address: command.authorizedAccAddr,
  });

  fields.push({
    type: "text",
    label: "Seed",
    value: command.seed,
  });

  fields.push({
    type: "address",
    label: "Authorized by",
    address: command.authorizedAccAddr,
  });

  fields.push({
    type: "address",
    label: "Fee payer",
    address: command.authorizedAccAddr,
  });

  return fields;
}
