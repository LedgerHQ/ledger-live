import type { Command, Transaction } from "./types";
import {
  buildTransferInstructions,
  buildTokenTransferInstructions,
  buildCreateAssociatedTokenAccountInstruction,
  buildStakeCreateAccountInstructions,
  buildStakeDelegateInstructions,
  buildStakeUndelegateInstructions,
  buildStakeWithdrawInstructions,
  buildStakeSplitInstructions,
} from "./api/chain/web3";
import { assertUnreachable } from "./utils";
import {
  PublicKey,
  VersionedTransaction as OnChainTransaction,
  TransactionInstruction,
  TransactionMessage,
} from "@solana/web3.js";
import { ChainAPI } from "./api";

export const buildTransactionWithAPI = async (
  address: string,
  transaction: Transaction,
  api: ChainAPI,
): Promise<readonly [OnChainTransaction, (signature: Buffer) => OnChainTransaction]> => {
  const instructions = await buildInstructions(transaction, api);

  const recentBlockhash = await api.getLatestBlockhash();

  const feePayer = new PublicKey(address);

  const tm = new TransactionMessage({
    payerKey: feePayer,
    recentBlockhash,
    instructions,
  });

  const tx = new OnChainTransaction(tm.compileToLegacyMessage());

  return [
    tx,
    (signature: Buffer) => {
      tx.addSignature(new PublicKey(address), signature);
      return tx;
    },
  ];
};

async function buildInstructions(
  tx: Transaction,
  api: ChainAPI,
): Promise<TransactionInstruction[]> {
  const { commandDescriptor } = tx.model;
  if (commandDescriptor === undefined) {
    throw new Error("missing command descriptor");
  }
  if (Object.keys(commandDescriptor.errors).length > 0) {
    throw new Error("cannot build invalid command");
  }
  return await buildInstructionsForCommand(commandDescriptor.command, api);
}

async function buildInstructionsForCommand(
  command: Command,
  api: ChainAPI,
): Promise<TransactionInstruction[]> {
  switch (command.kind) {
    case "transfer":
      return buildTransferInstructions(command);
    case "token.transfer":
      return buildTokenTransferInstructions(command);
    case "token.createATA":
      return buildCreateAssociatedTokenAccountInstruction(command);
    case "stake.createAccount":
      return buildStakeCreateAccountInstructions(command);
    case "stake.delegate":
      return buildStakeDelegateInstructions(command);
    case "stake.undelegate":
      return buildStakeUndelegateInstructions(command);
    case "stake.withdraw":
      return buildStakeWithdrawInstructions(command);
    case "stake.split":
      return await buildStakeSplitInstructions(command, api);
    default:
      return assertUnreachable(command);
  }
}
