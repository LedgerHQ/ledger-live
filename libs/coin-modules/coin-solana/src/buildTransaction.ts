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
  const instructions = await buildInstructions(api, transaction);

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
  api: ChainAPI,
  tx: Transaction,
): Promise<TransactionInstruction[]> {
  const { commandDescriptor } = tx.model;
  if (commandDescriptor === undefined) {
    throw new Error("missing command descriptor");
  }
  if (Object.keys(commandDescriptor.errors).length > 0) {
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
      return buildCreateAssociatedTokenAccountInstruction(command);
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
