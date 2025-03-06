import { Observable } from "rxjs";
import type { Account, AccountBridge, OperationType } from "@ledgerhq/types-live";
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
import { buildTransactionWithAPI } from "./buildTransaction";
import type { Resolution, SolanaSigner } from "./signer";
import BigNumber from "bignumber.js";
import { encodeOperationId } from "@ledgerhq/coin-framework/operation";
import { assertUnreachable } from "./utils";
import { ChainAPI } from "./api";
import { SignerContext } from "@ledgerhq/coin-framework/signer";
import { DeviceModelId } from "@ledgerhq/devices";

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

function getResolution(
  transaction: Transaction,
  deviceModelId?: DeviceModelId,
): Resolution | undefined {
  if (!transaction.subAccountId || !transaction.model.commandDescriptor) return;

  const { command } = transaction.model.commandDescriptor;
  switch (command.kind) {
    case "token.transfer": {
      if (command.recipientDescriptor.shouldCreateAsAssociatedTokenAccount) {
        return {
          deviceModelId,
          createATA: {
            address: command.recipientDescriptor.walletAddress,
            mintAddress: command.mintAddress,
          },
        };
      }
      return {
        deviceModelId,
        tokenAddress: command.recipientDescriptor.tokenAccAddress,
      };
    }
    // Not sure we need to handle this case as we don't use the TLV descriptor on the steps of createATA
    case "token.createATA": {
      return {
        deviceModelId,
        createATA: {
          address: command.owner,
          mintAddress: command.mint,
        },
      };
    }
  }
}

export const buildSignOperation =
  (
    signerContext: SignerContext<SolanaSigner>,
    api: () => Promise<ChainAPI>,
  ): AccountBridge<Transaction>["signOperation"] =>
  ({ account, deviceId, deviceModelId, transaction }) =>
    new Observable(subscriber => {
      const main = async () => {
        const [tx, recentBlockhash, signOnChainTransaction] = await buildTransactionWithAPI(
          account.freshAddress,
          transaction,
          await api(),
        );

        subscriber.next({
          type: "device-signature-requested",
        });
        console.log(
          "buildSignOperation",
          account,
          "deviceId",
          deviceId,
          "transaction",
          transaction,
        );
        console.log("buildSignOperation tx", tx, tx.message.serialize());
        const { signature } = await signerContext(deviceId, signer =>
          signer.signTransaction(
            account.freshAddressPath,
            Buffer.from(tx.message.serialize()),
            getResolution(transaction, deviceModelId),
          ),
        );

        console.log("buildSignOperation signerContext signature", signature);

        subscriber.next({
          type: "device-signature-granted",
        });

        const signedTx = signOnChainTransaction(signature);

        console.log("buildSignOperation signedTx", signedTx);
        console.log(
          "buildSignOperation signature",
          Buffer.from(signedTx.serialize()).toString("hex"),
        );

        subscriber.next({
          type: "signed",
          signedOperation: {
            operation: buildOptimisticOperation(account, transaction),
            signature: Buffer.from(signedTx.serialize()).toString("hex"),
            rawData: {
              recentBlockhash,
            },
          },
        });
      };

      main().then(
        () => subscriber.complete(),
        e => subscriber.error(e),
      );
    });

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
