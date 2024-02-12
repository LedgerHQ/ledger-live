import { Observable } from "rxjs";
import type { Account, OperationType, SignOperationEvent } from "@ledgerhq/types-live";
import { withDevice } from "../../hw/deviceAccess";
import type {
  Command,
  CommandDescriptor,
  SolanaOperation,
  SolanaOperationExtra,
  StakeCreateAccountCommand,
  StakeDelegateCommand,
  StakeSplitCommand,
  StakeUndelegateCommand,
  StakeWithdrawCommand,
  TokenTransferCommand,
  Transaction,
  TransferCommand,
} from "./types";
import { buildTransactionWithAPI } from "./js-buildTransaction";
import Solana from "@ledgerhq/hw-app-solana";
import BigNumber from "bignumber.js";
import { encodeOperationId } from "../../operation";
import { assertUnreachable } from "./utils";
import { ChainAPI } from "./api";

const buildOptimisticOperation = (account: Account, transaction: Transaction): SolanaOperation => {
  if (transaction.model.commandDescriptor === undefined) {
    throw new Error("command descriptor is missing");
  }

  const { commandDescriptor } = transaction.model;

  if (Object.keys(commandDescriptor.errors).length > 0) {
    throw new Error("invalid command");
  }

  const optimisticOp = buildOptimisticOperationForCommand(account, transaction, commandDescriptor);

  const lastOpSeqNumber =
    account.pendingOperations[0]?.transactionSequenceNumber ??
    account.operations[0]?.transactionSequenceNumber ??
    0;

  optimisticOp.transactionSequenceNumber = lastOpSeqNumber + 1;

  return optimisticOp;
};

export const signOperationWithAPI = (
  {
    account,
    deviceId,
    transaction,
  }: {
    account: Account;
    deviceId: any;
    transaction: Transaction;
  },
  api: () => Promise<ChainAPI>,
): Observable<SignOperationEvent> =>
  withDevice(deviceId)(
    transport =>
      new Observable(subscriber => {
        const main = async () => {
          const [tx, signOnChainTransaction] = await buildTransactionWithAPI(
            account.freshAddress,
            transaction,
            await api(),
          );

          const hwApp = new Solana(transport);

          subscriber.next({
            type: "device-signature-requested",
          });

          const { signature } = await hwApp.signTransaction(
            account.freshAddressPath,
            Buffer.from(tx.message.serialize()),
          );

          subscriber.next({
            type: "device-signature-granted",
          });

          const signedTx = signOnChainTransaction(signature);

          subscriber.next({
            type: "signed",
            signedOperation: {
              operation: buildOptimisticOperation(account, transaction),
              signature: Buffer.from(signedTx.serialize()).toString("hex"),
            },
          });
        };

        main().then(
          () => subscriber.complete(),
          e => subscriber.error(e),
        );
      }),
  );

function buildOptimisticOperationForCommand(
  account: Account,
  transaction: Transaction,
  commandDescriptor: CommandDescriptor,
): SolanaOperation {
  const { command } = commandDescriptor;
  switch (command.kind) {
    case "transfer":
      return optimisticOpForTransfer(account, transaction, command, commandDescriptor);
    case "token.transfer":
      return optimisticOpForTokenTransfer(account, transaction, command, commandDescriptor);
    case "token.createATA":
      return optimisticOpForCATA(account, commandDescriptor);
    case "stake.createAccount":
      return optimisticOpForStakeCreateAccount(account, transaction, command, commandDescriptor);
    case "stake.delegate":
      return optimisticOpForStakeDelegate(account, command, commandDescriptor);
    case "stake.undelegate":
      return optimisticOpForStakeUndelegate(account, command, commandDescriptor);
    case "stake.withdraw":
      return optimisticOpForStakeWithdraw(account, command, commandDescriptor);
    case "stake.split":
      return optimisticOpForStakeSplit(account, command, commandDescriptor);
    default:
      return assertUnreachable(command);
  }
}
function optimisticOpForTransfer(
  account: Account,
  transaction: Transaction,
  command: TransferCommand,
  commandDescriptor: CommandDescriptor,
): SolanaOperation {
  const commons = optimisticOpcommons(commandDescriptor);
  return {
    ...commons,
    id: encodeOperationId(account.id, "", "OUT"),
    type: "OUT",
    accountId: account.id,
    senders: [account.freshAddress],
    recipients: [transaction.recipient],
    value: new BigNumber(command.amount).plus(commons.fee ?? 0),
    extra: getOpExtras(command),
  };
}

function optimisticOpForTokenTransfer(
  account: Account,
  transaction: Transaction,
  command: TokenTransferCommand,
  commandDescriptor: CommandDescriptor,
): SolanaOperation {
  if (!transaction.subAccountId) {
    throw new Error("sub account id is required for token transfer");
  }
  return {
    ...optimisticOpcommons(commandDescriptor),
    id: encodeOperationId(account.id, "", "FEES"),
    type: "FEES",
    accountId: account.id,
    senders: [account.freshAddress],
    recipients: [transaction.recipient],
    value: new BigNumber(command.amount),
    extra: getOpExtras(command),
    subOperations: [
      {
        ...optimisticOpcommons(commandDescriptor),
        id: encodeOperationId(transaction.subAccountId, "", "OUT"),
        type: "OUT",
        accountId: transaction.subAccountId,
        senders: [account.freshAddress],
        recipients: [transaction.recipient],
        value: new BigNumber(command.amount),
        extra: getOpExtras(command),
      },
    ],
  };
}

function optimisticOpForCATA(
  account: Account,
  commandDescriptor: CommandDescriptor,
): SolanaOperation {
  const opType: OperationType = "OPT_IN";

  return {
    ...optimisticOpcommons(commandDescriptor),
    id: encodeOperationId(account.id, "", opType),
    type: opType,
    accountId: account.id,
    senders: [],
    recipients: [],
    value: new BigNumber(commandDescriptor.fee),
  };
}

function optimisticOpcommons(commandDescriptor: CommandDescriptor) {
  return {
    hash: "",
    fee: new BigNumber(commandDescriptor.fee),
    blockHash: null,
    blockHeight: null,
    date: new Date(),
    extra: {},
  };
}

function getOpExtras(command: Command): SolanaOperationExtra {
  const extra: SolanaOperationExtra = {};
  switch (command.kind) {
    case "transfer":
    case "token.transfer":
      if (command.memo !== undefined) {
        extra.memo = command.memo;
      }
      break;
    case "token.createATA":
    case "stake.createAccount":
    case "stake.delegate":
    case "stake.undelegate":
    case "stake.withdraw":
    case "stake.split":
      break;
    default:
      return assertUnreachable(command);
  }
  return extra;
}

function optimisticOpForStakeCreateAccount(
  account: Account,
  transaction: Transaction,
  command: StakeCreateAccountCommand,
  commandDescriptor: CommandDescriptor,
): SolanaOperation {
  const opType: OperationType = "DELEGATE";
  const commons = optimisticOpcommons(commandDescriptor);

  return {
    ...commons,
    id: encodeOperationId(account.id, "", opType),
    type: opType,
    accountId: account.id,
    senders: [],
    recipients: [],
    value: new BigNumber(command.amount).plus(commons.fee),
    extra: getOpExtras(command),
  };
}

function optimisticOpForStakeDelegate(
  account: Account,
  command: StakeDelegateCommand,
  commandDescriptor: CommandDescriptor,
): SolanaOperation {
  const commons = optimisticOpcommons(commandDescriptor);
  const opType: OperationType = "DELEGATE";
  return {
    ...commons,
    id: encodeOperationId(account.id, "", opType),
    type: opType,
    accountId: account.id,
    senders: [],
    recipients: [],
    value: commons.fee,
    extra: getOpExtras(command),
  };
}

function optimisticOpForStakeUndelegate(
  account: Account,
  command: StakeUndelegateCommand,
  commandDescriptor: CommandDescriptor,
): SolanaOperation {
  const commons = optimisticOpcommons(commandDescriptor);
  const opType: OperationType = "UNDELEGATE";
  return {
    ...commons,
    id: encodeOperationId(account.id, "", opType),
    type: opType,
    accountId: account.id,
    senders: [],
    recipients: [],
    value: commons.fee,
    extra: getOpExtras(command),
  };
}

function optimisticOpForStakeWithdraw(
  account: Account,
  command: StakeWithdrawCommand,
  commandDescriptor: CommandDescriptor,
): SolanaOperation {
  const commons = optimisticOpcommons(commandDescriptor);
  const opType: OperationType = "IN";
  return {
    ...commons,
    id: encodeOperationId(account.id, "", opType),
    type: opType,
    accountId: account.id,
    senders: [command.stakeAccAddr],
    recipients: [command.toAccAddr],
    value: new BigNumber(command.amount).minus(commons.fee),
    extra: getOpExtras(command),
  };
}

function optimisticOpForStakeSplit(
  account: Account,
  command: StakeSplitCommand,
  commandDescriptor: CommandDescriptor,
): SolanaOperation {
  const commons = optimisticOpcommons(commandDescriptor);
  const opType: OperationType = "OUT";
  return {
    ...commons,
    id: encodeOperationId(account.id, "", opType),
    type: opType,
    accountId: account.id,
    senders: [command.stakeAccAddr],
    recipients: [command.splitStakeAccAddr],
    value: commons.fee,
    extra: getOpExtras(command),
  };
}
