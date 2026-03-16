import type {
  CraftedTransaction,
  FeeEstimation,
  TransactionIntent,
} from "@ledgerhq/coin-framework/api/index";
import { isSendTransactionIntent } from "@ledgerhq/coin-framework/utils";
import { trace } from "@ledgerhq/logs";
import {
  PublicKey,
  VersionedTransaction,
  TransactionInstruction,
  TransactionMessage,
  BlockhashWithExpiryBlockHeight,
} from "@solana/web3.js";
import { isValidBase58Address } from "../logic";
import type { ChainAPI } from "../network";
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
  findAssociatedTokenAccountPubkey,
  getMaybeMintAccount,
  getMaybeTokenAccount,
  getMaybeTokenMintProgram,
} from "../network/chain/web3";
import { UserInputType } from "../signer";
import type {
  Command,
  TokenTransferCommand,
  TransferCommand,
  Transaction,
  SolanaTokenProgram,
} from "../types";
import { assertUnreachable, DUMMY_SIGNATURE } from "../utils";

// ---------------------------------------------------------------------------
// Alpaca API: craft a transaction from a TransactionIntent
// ---------------------------------------------------------------------------

export async function craftTransaction(
  api: ChainAPI,
  intent: TransactionIntent,
  customFees?: FeeEstimation,
): Promise<CraftedTransaction> {
  if (!isSendTransactionIntent(intent)) {
    throw new Error("Only send transaction intents are supported");
  }

  if (!isValidBase58Address(intent.sender)) {
    throw new Error("Invalid sender address");
  }
  if (!isValidBase58Address(intent.recipient)) {
    throw new Error("Invalid recipient address");
  }
  if (intent.amount > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new Error("Amount exceeds safe integer range");
  }

  const recentBlockhash = await api.getLatestBlockhash();

  const memo = "memo" in intent ? intent.memo : undefined;
  const memoValue = typeof memo === "string" ? memo : undefined;

  const command = await resolveCommandFromIntent(api, intent, memoValue);
  const instructions = await buildInstructionsForCommand(api, command);

  const message = new TransactionMessage({
    payerKey: new PublicKey(intent.sender),
    recentBlockhash: recentBlockhash.blockhash,
    instructions,
  });

  const transaction = new VersionedTransaction(message.compileToLegacyMessage());

  let fee: bigint;
  if (customFees) {
    fee = customFees.value;
  } else {
    const feeForMsg = await api.getFeeForMessage(transaction.message);
    fee = BigInt(feeForMsg ?? 5000);
  }

  return {
    transaction: Buffer.from(transaction.serialize()).toString("base64"),
    details: {
      recentBlockhash: recentBlockhash.blockhash,
      lastValidBlockHeight: recentBlockhash.lastValidBlockHeight,
      estimatedFee: fee.toString(),
    },
  };
}

// ---------------------------------------------------------------------------
// Bridge: build a VersionedTransaction from a bridge Transaction
// ---------------------------------------------------------------------------

export const buildVersionedTransaction = async (
  address: string,
  transaction: Transaction,
  api: ChainAPI,
): Promise<
  readonly [
    VersionedTransaction,
    BlockhashWithExpiryBlockHeight,
    (signature: Buffer) => VersionedTransaction,
  ]
> => {
  const recentBlockhash = await api.getLatestBlockhash();

  let web3SolanaTransaction: VersionedTransaction;
  if (transaction.raw) {
    web3SolanaTransaction = VersionedTransaction.deserialize(
      Buffer.from(transaction.raw, "base64"),
    );
    if (web3SolanaTransaction.signatures.every(sig => Buffer.from(sig).equals(DUMMY_SIGNATURE))) {
      web3SolanaTransaction.message.recentBlockhash = recentBlockhash.blockhash;
    }
  } else {
    const instructions = await buildInstructionsFromTransaction(api, transaction);
    const transactionMessage = new TransactionMessage({
      payerKey: new PublicKey(address),
      recentBlockhash: recentBlockhash.blockhash,
      instructions,
    });

    web3SolanaTransaction = new VersionedTransaction(transactionMessage.compileToLegacyMessage());
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

// ---------------------------------------------------------------------------
// Shared: Command → TransactionInstruction[]
// ---------------------------------------------------------------------------

export async function buildInstructionsForCommand(
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
    case "raw":
      throw new Error("Raw transactions should not be built with this function");
    default:
      return assertUnreachable(command);
  }
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

async function buildInstructionsFromTransaction(
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

async function resolveCommandFromIntent(
  api: ChainAPI,
  intent: TransactionIntent,
  memo?: string,
): Promise<Command> {
  const mintAddress = getTokenMintAddress(intent);
  if (mintAddress) {
    return resolveTokenTransferCommand(api, intent, mintAddress, memo);
  }
  return resolveNativeTransferCommand(intent, memo);
}

function resolveNativeTransferCommand(intent: TransactionIntent, memo?: string): TransferCommand {
  return {
    kind: "transfer",
    sender: intent.sender,
    recipient: intent.recipient,
    amount: Number(intent.amount),
    memo,
  };
}

function getTokenMintAddress(intent: TransactionIntent): string | undefined {
  if (intent.asset.type === "native") return undefined;
  if ("assetReference" in intent.asset && intent.asset.assetReference) {
    return intent.asset.assetReference;
  }
  return undefined;
}

async function resolveTokenTransferCommand(
  api: ChainAPI,
  intent: TransactionIntent,
  mintAddress: string,
  memo?: string,
): Promise<TokenTransferCommand> {
  const [mintAccount, mintProgram] = await Promise.all([
    getMaybeMintAccount(mintAddress, api),
    getMaybeTokenMintProgram(mintAddress, api),
  ]);
  if (!mintAccount || mintAccount instanceof Error) {
    throw new Error(`Cannot resolve mint account for ${mintAddress}`);
  }

  const resolvedProgram: SolanaTokenProgram =
    mintProgram && !(mintProgram instanceof Error) ? mintProgram : "spl-token";
  const mintDecimals = mintAccount.decimals;

  const senderAta = await findAssociatedTokenAccountPubkey(
    intent.sender,
    mintAddress,
    resolvedProgram,
  );

  const recipientAta = await findAssociatedTokenAccountPubkey(
    intent.recipient,
    mintAddress,
    resolvedProgram,
  );
  const recipientAtaAddress = recipientAta.toBase58();

  const recipientTokenAccount = await getMaybeTokenAccount(recipientAtaAddress, api);
  const shouldCreateAta =
    recipientTokenAccount === undefined || recipientTokenAccount instanceof Error;

  return {
    kind: "token.transfer",
    ownerAddress: intent.sender,
    ownerAssociatedTokenAccountAddress: senderAta.toBase58(),
    recipientDescriptor: {
      walletAddress: intent.recipient,
      tokenAccAddress: recipientAtaAddress,
      shouldCreateAsAssociatedTokenAccount: shouldCreateAta,
      userInputType: UserInputType.SOL,
    },
    amount: Number(intent.amount),
    mintAddress,
    mintDecimals,
    tokenId: mintAddress,
    memo,
    tokenProgram: resolvedProgram,
  };
}
