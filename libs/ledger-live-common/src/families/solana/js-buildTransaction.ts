import type { Account } from "../../types";
import type { Command, Transaction } from "./types";
import {
  addSignatureToTransaction,
  buildTransferInstructions,
  buildTokenTransferInstructions,
  buildCreateAssociatedTokenAccountInstruction,
} from "./api/chain/web3";
import { assertUnreachable } from "./utils";
import {
  PublicKey,
  Transaction as OnChainTransaction,
  TransactionInstruction,
} from "@solana/web3.js";
import { ChainAPI } from "./api";

export const buildTransactionWithAPI = async (
  account: Account,
  transaction: Transaction,
  api: ChainAPI
): Promise<readonly [Buffer, (signature: Buffer) => Buffer]> => {
  const instructions = buildInstructions(transaction);

  const recentBlockhash = await api.getRecentBlockhash();

  const feePayer = new PublicKey(account.freshAddress);

  const tx = new OnChainTransaction({
    feePayer,
    recentBlockhash,
  });

  tx.add(...instructions);

  return [
    tx.compileMessage().serialize(),
    (signature: Buffer) => {
      return addSignatureToTransaction({
        tx,
        address: account.freshAddress,
        signature,
      }).serialize();
    },
  ] as const;
};

function buildInstructions(tx: Transaction) {
  const { commandDescriptor } = tx.model;
  if (commandDescriptor === undefined) {
    throw new Error("missing command descriptor");
  }
  switch (commandDescriptor.status) {
    case "valid":
      return buildInstructionsForCommand(commandDescriptor.command);
    case "invalid":
      throw new Error("can not build invalid command");
    default:
      return assertUnreachable(commandDescriptor);
  }
}

function buildInstructionsForCommand(
  command: Command
): TransactionInstruction[] {
  switch (command.kind) {
    case "transfer":
      return buildTransferInstructions(command);
    case "token.transfer":
      return buildTokenTransferInstructions(command);
    case "token.createATA":
      return buildCreateAssociatedTokenAccountInstruction(command);
    default:
      return assertUnreachable(command);
  }
}
