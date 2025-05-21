import type { Command, Transaction } from "./types";
import {
  buildTransferInstructions,
  buildTokenTransferInstructions,
  buildCreateAssociatedTokenAccountInstruction,
  buildApproveTransactionInstructions,
  buildRevokeTransactionInstructions,
  buildStakeCreateAccountInstructions,
  buildStakeDelegateInstructions,
  buildStakeUndelegateInstructions,
  buildStakeWithdrawInstructions,
  buildStakeSplitInstructions,
} from "./network/chain/web3";
import { assertUnreachable } from "./utils";
import {
  PublicKey,
  VersionedTransaction as OnChainTransaction,
  TransactionInstruction,
  TransactionMessage,
  BlockhashWithExpiryBlockHeight,
  VersionedTransaction,
} from "@solana/web3.js";
import { ChainAPI } from "./network";
import { trace } from "@ledgerhq/logs";

export const buildTransactionWithAPI = async (
  address: string,
  transaction: Transaction,
  api: ChainAPI,
): Promise<
  readonly [
    OnChainTransaction,
    BlockhashWithExpiryBlockHeight,
    (signature: Buffer) => OnChainTransaction,
  ]
> => {
  const recentBlockhash = await api.getLatestBlockhash();

  let web3SolanaTransaction: VersionedTransaction;
  if (transaction.raw) {
    web3SolanaTransaction = OnChainTransaction.deserialize(Buffer.from(transaction.raw, "base64"));
  } else {
    const instructions = await buildInstructions(api, transaction);
    const transactionMessage = new TransactionMessage({
      payerKey: new PublicKey(address),
      recentBlockhash: recentBlockhash.blockhash,
      instructions,
    });

    web3SolanaTransaction = new OnChainTransaction(transactionMessage.compileToLegacyMessage());
  }

  return [
    web3SolanaTransaction,
    recentBlockhash,
    (signature: Buffer) => {
      web3SolanaTransaction.addSignature(new PublicKey(address), signature);
      return web3SolanaTransaction;
    },
  ];
};

async function buildInstructions(
  api: ChainAPI,
  tx: Transaction,
): Promise<TransactionInstruction[]> {
  const { commandDescriptor } = tx.model;
  if (commandDescriptor === undefined) {
    throw new Error("missing command descriptor");
  }
  const errorEntries = Object.entries(commandDescriptor.errors);
  if (errorEntries.length > 0) {
    trace({
      type: "solana/buildTransaction",
      message: "can not build invalid command",
      data: Object.fromEntries(errorEntries.map(([key, value]) => [key, value.message])),
      context: { commandKind: commandDescriptor.command.kind },
    });
    throw new Error("can not build invalid command");
  }
  return buildInstructionsForCommand(api, commandDescriptor.command);
}

async function buildInstructionsForCommand(
  api: ChainAPI,
  command: Command,
): Promise<TransactionInstruction[]> {
  switch (command.kind) {
    case "transfer":
      return buildTransferInstructions(api, command);
    case "token.transfer":
      return buildTokenTransferInstructions(api, command);
    case "token.createATA":
      return buildCreateAssociatedTokenAccountInstruction(api, command);
    case "token.approve":
      return buildApproveTransactionInstructions(api, command);
    case "token.revoke":
      return buildRevokeTransactionInstructions(api, command);
    case "stake.createAccount":
      return buildStakeCreateAccountInstructions(api, command);
    case "stake.delegate":
      return buildStakeDelegateInstructions(api, command);
    case "stake.undelegate":
      return buildStakeUndelegateInstructions(api, command);
    case "stake.withdraw":
      return buildStakeWithdrawInstructions(api, command);
    case "stake.split":
      return buildStakeSplitInstructions(api, command);
    default:
      return assertUnreachable(command);
  }
}
