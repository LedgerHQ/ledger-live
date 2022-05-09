import type { Account } from "../../types";
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
  Transaction as OnChainTransaction,
  TransactionInstruction,
} from "@solana/web3.js";
import { ChainAPI } from "./api";

export const buildTransactionWithAPI = async (
  account: Account,
  transaction: Transaction,
  api: ChainAPI
): Promise<
  readonly [OnChainTransaction, (signature: Buffer) => OnChainTransaction]
> => {
  const instructions = buildInstructions(transaction);

  const recentBlockhash = await api.getLatestBlockhash();

  const feePayer = new PublicKey(account.freshAddress);

  const tx = new OnChainTransaction({
    feePayer,
    recentBlockhash,
  });

  tx.add(...instructions);

  return [
    tx,
    (signature: Buffer) => {
      tx.addSignature(new PublicKey(account.freshAddress), signature);
      return tx;
    },
  ];
};

function buildInstructions(tx: Transaction): TransactionInstruction[] {
  const { commandDescriptor } = tx.model;
  if (commandDescriptor === undefined) {
    throw new Error("missing command descriptor");
  }
  if (Object.keys(commandDescriptor.errors).length > 0) {
    throw new Error("can not build invalid command");
  }
  return buildInstructionsForCommand(commandDescriptor.command);
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
    case "stake.createAccount":
      return buildStakeCreateAccountInstructions(command);
    case "stake.delegate":
      return buildStakeDelegateInstructions(command);
    case "stake.undelegate":
      return buildStakeUndelegateInstructions(command);
    case "stake.withdraw":
      return buildStakeWithdrawInstructions(command);
    case "stake.split":
      return buildStakeSplitInstructions(command);
    default:
      return assertUnreachable(command);
  }
}
