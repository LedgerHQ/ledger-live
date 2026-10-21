import type {
  CraftedTransaction,
  FeeEstimation,
  MemoNotSupported,
  StakingTransactionIntent,
  StringMemo,
  TransactionIntent,
} from "@ledgerhq/coin-module-framework/api/index";
import { isSendTransactionIntent } from "@ledgerhq/coin-module-framework/utils";
import { trace } from "@ledgerhq/logs";
import {
  ComputeBudgetProgram,
  PublicKey,
  SystemProgram,
  VersionedTransaction,
  TransactionInstruction,
  TransactionMessage,
  BlockhashWithExpiryBlockHeight,
  type VersionedMessage,
} from "@solana/web3.js";
import { transferFeeForIntent, tokenProgramOfMint } from "../helpers/token";
import { isValidBase58Address } from "../logic";
import { SolanaTokenAccountHoldsAnotherToken } from "../errors";
import type { ChainAPI } from "../network";
import type { TransferFeeConfigExt } from "../network/chain/account/tokenExtensions";
import { PARSED_PROGRAMS } from "../network/chain/program/constants";
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
  getMaybeTokenAccount,
  getMaybeTokenMint,
  getStakeAccountAddressWithSeed,
  getStakeAccountMinimumBalanceForRentExemption,
} from "../network/chain/web3";
import { UserInputType } from "../signer";
import { withdrawableFromStake } from "../logic";
import { getStakeAccounts } from "../network/chain/stake-activation/rpc";
import { createStakeAccountSeed } from "../stakeAccountSeed";
import type {
  Command,
  StakeCreateAccountCommand,
  StakeDelegateCommand,
  StakeUndelegateCommand,
  StakeSplitCommand,
  StakeWithdrawCommand,
  TokenTransferCommand,
  TransferCommand,
  Transaction,
  SolanaTokenProgram,
  SolanaTransactionIntentData,
} from "../types";
import { assertUnreachable, DUMMY_SIGNATURE, ZERO_FILLED_DUMMY_SIGNATURE } from "../utils";

// ---------------------------------------------------------------------------
// Coin Module API: craft a transaction from a TransactionIntent
// ---------------------------------------------------------------------------

export async function craftTransaction(
  api: ChainAPI,
  intent:
    | TransactionIntent<StringMemo | MemoNotSupported, SolanaTransactionIntentData>
    | StakingTransactionIntent<StringMemo | MemoNotSupported, SolanaTransactionIntentData>,
  customFees?: FeeEstimation,
): Promise<CraftedTransaction> {
  if (!isValidBase58Address(intent.sender)) {
    throw new Error("Invalid sender address");
  }

  if ("data" in intent && intent.data.type === "buffer") {
    return craftPrebuiltTransaction(api, intent.data.value, intent.sender, customFees);
  }

  if (intent.type === "stake.withdraw") {
    return craftWithdrawTransaction(api, intent as StakingTransactionIntent, customFees);
  }

  if (intent.type === "stake.createAccount") {
    return craftCreateStakeAccountFromIntent(api, intent as StakingTransactionIntent, customFees);
  }

  if (intent.type === "stake.delegate") {
    return craftDelegateFromIntent(
      api,
      intent as StakingTransactionIntent<StringMemo | MemoNotSupported>,
      customFees,
    );
  }

  if (intent.type === "stake.undelegate") {
    return craftUndelegateFromIntent(api, intent as StakingTransactionIntent, customFees);
  }

  if (intent.type === "stake.split") {
    return craftSplitStakeFromIntent(
      api,
      intent as StakingTransactionIntent<StringMemo | MemoNotSupported>,
      customFees,
    );
  }

  if (
    intent.type === "token.createATA" ||
    intent.type === "token.approve" ||
    intent.type === "token.revoke"
  ) {
    return craftTokenAuthorityFromIntent(api, intent, customFees);
  }

  return craftSendTransactionFromIntent(api, intent, customFees);
}

async function craftPrebuiltTransaction(
  api: ChainAPI,
  raw: Buffer,
  sender: string,
  customFees?: FeeEstimation,
): Promise<CraftedTransaction> {
  let transaction: VersionedTransaction;
  try {
    transaction = VersionedTransaction.deserialize(raw);
  } catch {
    throw new Error("Invalid or unsupported raw transaction");
  }

  const feePayer = transaction.message.staticAccountKeys[0]?.toBase58();
  if (feePayer && feePayer !== sender) {
    throw new Error("Sender does not match transaction fee payer");
  }

  const recentBlockhash = await api.getLatestBlockhash();
  const unsigned = transaction.signatures.every(sig => {
    const buf = Buffer.from(sig);
    return buf.equals(DUMMY_SIGNATURE) || buf.equals(ZERO_FILLED_DUMMY_SIGNATURE);
  });
  if (unsigned) {
    transaction.message.recentBlockhash = recentBlockhash.blockhash;
  }

  const fee = customFees ? customFees.value : await feeForMessage(api, transaction.message);

  return {
    transaction: Buffer.from(transaction.serialize()).toString("base64"),
    details: {
      recentBlockhash: transaction.message.recentBlockhash,
      lastValidBlockHeight: recentBlockhash.lastValidBlockHeight,
      estimatedFee: fee.toString(),
    },
  };
}

async function liveWithdrawable(
  api: ChainAPI,
  intent: StakingTransactionIntent,
): Promise<number | undefined> {
  const stakeAccounts = await getStakeAccounts(api, intent.sender);
  const stakeAccount = stakeAccounts.find(
    ({ account }) => account.onChainAcc.pubkey.toBase58() === intent.recipient,
  );
  if (!stakeAccount) return undefined;

  const { account, activation } = stakeAccount;
  return Math.max(
    0,
    withdrawableFromStake({
      stakeAccBalance: account.onChainAcc.account.lamports,
      activation,
      rentExemptReserve: account.info.meta.rentExemptReserve.toNumber(),
    }),
  );
}

async function craftWithdrawTransaction(
  api: ChainAPI,
  intent: StakingTransactionIntent,
  customFees?: FeeEstimation,
): Promise<CraftedTransaction> {
  const withdrawable = await liveWithdrawable(api, intent);
  if (withdrawable === undefined) {
    // No amount would succeed, so signing the stale one only defers the failure to the chain.
    throw new Error(`No stake account ${intent.recipient} to withdraw from`);
  }
  if (withdrawable <= 0) {
    throw new Error(`Stake account ${intent.recipient} has nothing to withdraw`);
  }
  const command: StakeWithdrawCommand = {
    kind: "stake.withdraw",
    authorizedAccAddr: intent.sender,
    stakeAccAddr: intent.recipient,
    toAccAddr: intent.sender,
    amount: withdrawable,
  };
  const instructions = pinComputeBudget(
    await buildInstructionsForCommand(api, command),
    customFees,
  );
  const recentBlockhash = await api.getLatestBlockhash();

  const message = new TransactionMessage({
    payerKey: new PublicKey(intent.sender),
    recentBlockhash: recentBlockhash.blockhash,
    instructions,
  });

  const transaction = new VersionedTransaction(message.compileToLegacyMessage());

  const fee = customFees ? customFees.value : await feeForMessage(api, transaction.message);

  return {
    transaction: Buffer.from(transaction.serialize()).toString("base64"),
    details: {
      recentBlockhash: recentBlockhash.blockhash,
      lastValidBlockHeight: recentBlockhash.lastValidBlockHeight,
      estimatedFee: fee.toString(),
    },
  };
}

async function craftCreateStakeAccountFromIntent(
  api: ChainAPI,
  intent: StakingTransactionIntent,
  customFees?: FeeEstimation,
): Promise<CraftedTransaction> {
  const seed = stakeAccountSeedOfIntent(intent) ?? createStakeAccountSeed();
  const stakeAccAddress = await getStakeAccountAddressWithSeed({
    fromAddress: intent.sender,
    seed,
  });
  const stakeAccRentExemptAmount = await getStakeAccountMinimumBalanceForRentExemption(api);
  const delegationAmount = intent.useAllAmount
    ? Math.max(0, Number(intent.amount) - stakeAccRentExemptAmount)
    : Number(intent.amount);
  const command: StakeCreateAccountCommand = {
    kind: "stake.createAccount",
    fromAccAddress: intent.sender,
    stakeAccAddress,
    seed,
    amount: delegationAmount,
    stakeAccRentExemptAmount,
    delegate: { voteAccAddress: intent.recipient },
  };
  return craftCommandToTransaction(api, command, intent.sender, customFees);
}

async function craftDelegateFromIntent(
  api: ChainAPI,
  intent: StakingTransactionIntent<StringMemo | MemoNotSupported>,
  customFees?: FeeEstimation,
): Promise<CraftedTransaction> {
  const valAddress = "valAddress" in intent ? intent.valAddress : undefined;
  const memo = "memo" in intent ? intent.memo : undefined;
  const stakeAccAddr = memo?.type === "string" ? memo.value : undefined;
  if (!stakeAccAddr) {
    throw new Error("stake.delegate requires a stake account address (via the memo)");
  }
  const voteAccAddr = valAddress ?? intent.recipient;
  const command: StakeDelegateCommand = {
    kind: "stake.delegate",
    authorizedAccAddr: intent.sender,
    stakeAccAddr,
    voteAccAddr,
  };
  return craftCommandToTransaction(api, command, intent.sender, customFees);
}

async function craftUndelegateFromIntent(
  api: ChainAPI,
  intent: StakingTransactionIntent,
  customFees?: FeeEstimation,
): Promise<CraftedTransaction> {
  const command: StakeUndelegateCommand = {
    kind: "stake.undelegate",
    authorizedAccAddr: intent.sender,
    stakeAccAddr: intent.recipient,
  };
  return craftCommandToTransaction(api, command, intent.sender, customFees);
}

async function craftSplitStakeFromIntent(
  api: ChainAPI,
  intent: StakingTransactionIntent<StringMemo | MemoNotSupported>,
  customFees?: FeeEstimation,
): Promise<CraftedTransaction> {
  const memo = "memo" in intent ? intent.memo : undefined;
  const stakeAccAddr = memo?.type === "string" ? memo.value : intent.recipient;
  if (!stakeAccAddr) {
    throw new Error("stake.split requires a stake account address");
  }

  const seed = stakeAccountSeedOfIntent(intent) ?? createStakeAccountSeed();
  const command: StakeSplitCommand = {
    kind: "stake.split",
    authorizedAccAddr: intent.sender,
    stakeAccAddr,
    amount: Number(intent.amount),
    seed,
    splitStakeAccAddr: await getStakeAccountAddressWithSeed({ fromAddress: intent.sender, seed }),
  };
  return craftCommandToTransaction(api, command, intent.sender, customFees);
}

async function craftTokenAuthorityFromIntent(
  api: ChainAPI,
  intent: TransactionIntent<StringMemo | MemoNotSupported>,
  customFees?: FeeEstimation,
): Promise<CraftedTransaction> {
  const mintAddress = getTokenMintAddress(intent);
  if (!mintAddress) {
    throw new Error(`${intent.type} requires a token asset`);
  }
  // A high-supply token can exceed this, and `Number` would round the allowance silently.
  if (intent.type === "token.approve" && intent.amount > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new Error("Amount exceeds safe integer range");
  }

  const mint = await getMaybeTokenMint(mintAddress, api);
  if (!mint || mint instanceof Error) {
    throw new Error(`Cannot resolve mint account for ${mintAddress}`);
  }
  const tokenProgram = tokenProgramOfMint(mint);

  const ownerAta = (
    await findAssociatedTokenAccountPubkey(intent.sender, mintAddress, tokenProgram)
  ).toBase58();

  const command: Command =
    intent.type === "token.createATA"
      ? {
          kind: "token.createATA",
          owner: intent.sender,
          mint: mintAddress,
          associatedTokenAccountAddress: ownerAta,
          tokenProgram,
        }
      : intent.type === "token.revoke"
        ? { kind: "token.revoke", account: ownerAta, owner: intent.sender, tokenProgram }
        : {
            kind: "token.approve",
            account: ownerAta,
            mintAddress,
            recipientDescriptor: await resolveRecipientDescriptor(
              api,
              intent.recipient,
              mintAddress,
              tokenProgram,
            ),
            owner: intent.sender,
            amount: Number(intent.amount),
            decimals: mint.info.decimals,
            tokenProgram,
          };

  return craftCommandToTransaction(api, command, intent.sender, customFees);
}

async function craftSendTransactionFromIntent(
  api: ChainAPI,
  intent: TransactionIntent<StringMemo | MemoNotSupported>,
  customFees?: FeeEstimation,
): Promise<CraftedTransaction> {
  if (!isSendTransactionIntent(intent)) {
    throw new Error(`Unsupported intent type: ${intent.intentType}`);
  }
  if (!isValidBase58Address(intent.recipient)) {
    throw new Error("Invalid recipient address");
  }
  if (intent.amount > BigInt(Number.MAX_SAFE_INTEGER)) {
    throw new Error("Amount exceeds safe integer range");
  }

  const recentBlockhash = await api.getLatestBlockhash();
  const memoValue = "memo" in intent ? (intent.memo as StringMemo).value : undefined;
  const command = await resolveCommandFromIntent(api, intent, memoValue);
  const instructions = pinComputeBudget(
    await buildInstructionsForCommand(api, command),
    customFees,
  );

  const message = new TransactionMessage({
    payerKey: new PublicKey(intent.sender),
    recentBlockhash: recentBlockhash.blockhash,
    instructions,
  });
  const transaction = new VersionedTransaction(message.compileToLegacyMessage());

  const fee = customFees ? customFees.value : await feeForMessage(api, transaction.message);

  return {
    transaction: Buffer.from(transaction.serialize()).toString("base64"),
    details: {
      recentBlockhash: recentBlockhash.blockhash,
      lastValidBlockHeight: recentBlockhash.lastValidBlockHeight,
      estimatedFee: fee.toString(),
    },
  };
}

async function craftCommandToTransaction(
  api: ChainAPI,
  command: Command,
  payerKey: string,
  customFees?: FeeEstimation,
): Promise<CraftedTransaction> {
  const instructions = pinComputeBudget(
    await buildInstructionsForCommand(api, command),
    customFees,
  );
  const recentBlockhash = await api.getLatestBlockhash();
  const message = new TransactionMessage({
    payerKey: new PublicKey(payerKey),
    recentBlockhash: recentBlockhash.blockhash,
    instructions,
  });
  const transaction = new VersionedTransaction(message.compileToLegacyMessage());
  const fee = customFees ? customFees.value : await feeForMessage(api, transaction.message);
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
    (signature: Buffer, recentBlockhash?: BlockhashWithExpiryBlockHeight) => VersionedTransaction,
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
    (signature: Buffer, recentBlockhash?: BlockhashWithExpiryBlockHeight) => {
      if (recentBlockhash) {
        web3SolanaTransaction.message.recentBlockhash = recentBlockhash.blockhash;
      }
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
// Shared: compute budget
// ---------------------------------------------------------------------------

const LAMPORTS_PER_SIGNATURE = 5000n;
const MAX_COMPUTE_UNIT_LIMIT = 1_400_000;

export type ComputeBudget = { computeUnitPrice?: bigint; computeUnitLimit?: number };

function isComputeBudget(ix: TransactionInstruction): boolean {
  return ix.programId.equals(ComputeBudgetProgram.programId);
}

function isBuiltin(ix: TransactionInstruction): boolean {
  return isComputeBudget(ix) || ix.programId.equals(SystemProgram.programId);
}

/** Decoded by hand: web3.js throws on the compute-budget instructions it has no layout for. */
export function computeBudgetOf(instructions: TransactionInstruction[]): ComputeBudget {
  const budget: ComputeBudget = {};
  for (const ix of instructions.filter(isComputeBudget)) {
    // A partner transaction may carry a truncated one; the runtime rejects it, the estimate need not.
    if (ix.data[0] === 2 && ix.data.length >= 5) budget.computeUnitLimit = ix.data.readUInt32LE(1);
    if (ix.data[0] === 3 && ix.data.length >= 9)
      budget.computeUnitPrice = ix.data.readBigUInt64LE(1);
  }
  return budget;
}

/** Program ids are always static keys, so this reads the program of every instruction. */
export function instructionsOfMessage(message: VersionedMessage): TransactionInstruction[] {
  return message.compiledInstructions.map(
    ix =>
      new TransactionInstruction({
        keys: [],
        programId: message.staticAccountKeys[ix.programIdIndex] ?? PublicKey.default,
        data: Buffer.from(ix.data),
      }),
  );
}

/**
 * The fee of a message the RPC could not price: base fee plus the priority fee it carries. Without a
 * requested limit, Agave grants 3,000 CU per builtin instruction and 200,000 per other one, capped at
 * 1.4M (compute_budget_instruction_details.rs). Only the System and Compute Budget programs count as
 * builtins here: the others are migrating to BPF, and an overestimate only leaves dust where an
 * underestimate breaks send-max.
 */
export function fallbackFee(message: VersionedMessage): bigint {
  const instructions = instructionsOfMessage(message);
  const { computeUnitPrice = 0n, computeUnitLimit } = computeBudgetOf(instructions);
  const builtinCount = instructions.filter(isBuiltin).length;
  const limit = Math.min(
    computeUnitLimit ?? (instructions.length - builtinCount) * 200_000 + builtinCount * 3_000,
    MAX_COMPUTE_UNIT_LIMIT,
  );
  // Agave rounds the priority fee up (compute_budget_limits.rs).
  return (
    BigInt(message.header.numRequiredSignatures) * LAMPORTS_PER_SIGNATURE +
    (computeUnitPrice * BigInt(limit) + 999_999n) / 1_000_000n
  );
}

export async function feeForMessage(api: ChainAPI, message: VersionedMessage): Promise<bigint> {
  const fee = await api.getFeeForMessage(message);
  return typeof fee === "number" ? BigInt(fee) : fallbackFee(message);
}

function isAmount(value: unknown): value is string | number | bigint {
  return (
    typeof value === "bigint" ||
    (typeof value === "number" && Number.isInteger(value)) ||
    (typeof value === "string" && /^\d+$/.test(value))
  );
}

/**
 * Crafting re-samples the recent fees and re-simulates the compute units, so the signed fee could
 * drift from the one the user approved: a later sample, a memo the estimate did not see. When the
 * estimate's price is forwarded (the wallet does it for this family), it replaces the fresh one, and
 * the larger of the two requested limits is signed: the same transaction keeps the estimated fee, and one whose
 * shape changed since, such as a recipient token account closed in between, keeps enough compute
 * units to land. No limit on either side means the runtime default.
 */
export function pinComputeBudget(
  instructions: TransactionInstruction[],
  customFees?: FeeEstimation,
): TransactionInstruction[] {
  const price = customFees?.parameters?.computeUnitPrice;
  const limit = customFees?.parameters?.computeUnitLimit;
  if (!isAmount(price) || (limit !== undefined && !isAmount(limit))) return instructions;
  const units = Math.max(Number(limit ?? 0), computeBudgetOf(instructions).computeUnitLimit ?? 0);
  return [
    ...(units > 0 ? [ComputeBudgetProgram.setComputeUnitLimit({ units })] : []),
    ComputeBudgetProgram.setComputeUnitPrice({ microLamports: BigInt(price) }),
    ...instructions.filter(ix => !isComputeBudget(ix)),
  ];
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

export function stakeAccountSeedOfIntent(
  intent: TransactionIntent<StringMemo | MemoNotSupported, SolanaTransactionIntentData>,
): string | undefined {
  if (!("data" in intent) || intent.data.type !== "stakeAccountSeed") return undefined;
  return intent.data.value;
}

function getTokenMintAddress(intent: TransactionIntent): string | undefined {
  if (intent.asset.type === "native") return undefined;
  if ("assetReference" in intent.asset && intent.asset.assetReference) {
    return intent.asset.assetReference;
  }
  return undefined;
}

export async function resolveRecipientDescriptor(
  api: ChainAPI,
  recipient: string,
  mintAddress: string,
  tokenProgram: SolanaTokenProgram,
): Promise<TokenTransferCommand["recipientDescriptor"]> {
  const recipientTokenAccount = await getMaybeTokenAccount(recipient, api);
  if (recipientTokenAccount instanceof Error) throw recipientTokenAccount;
  if (recipientTokenAccount) {
    if (recipientTokenAccount.mint.toBase58() !== mintAddress) {
      throw new SolanaTokenAccountHoldsAnotherToken();
    }
    return {
      walletAddress: recipientTokenAccount.owner.toBase58(),
      tokenAccAddress: recipient,
      shouldCreateAsAssociatedTokenAccount: false,
      userInputType: UserInputType.ATA,
    };
  }

  const associatedAddress = (
    await findAssociatedTokenAccountPubkey(recipient, mintAddress, tokenProgram)
  ).toBase58();
  const associatedAccount = await getMaybeTokenAccount(associatedAddress, api);
  if (associatedAccount instanceof Error) throw associatedAccount;

  return {
    walletAddress: recipient,
    tokenAccAddress: associatedAddress,
    shouldCreateAsAssociatedTokenAccount: associatedAccount === undefined,
    userInputType: UserInputType.SOL,
  };
}

async function resolveTokenTransferCommand(
  api: ChainAPI,
  intent: TransactionIntent,
  mintAddress: string,
  memo?: string,
): Promise<TokenTransferCommand> {
  const mint = await getMaybeTokenMint(mintAddress, api);
  if (!mint || mint instanceof Error) {
    throw new Error(`Cannot resolve mint account for ${mintAddress}`);
  }

  const mintAccount = mint.info;
  const resolvedProgram = tokenProgramOfMint(mint);
  const mintDecimals = mintAccount.decimals;

  const senderAta = await findAssociatedTokenAccountPubkey(
    intent.sender,
    mintAddress,
    resolvedProgram,
  );

  const command: TokenTransferCommand = {
    kind: "token.transfer",
    ownerAddress: intent.sender,
    ownerAssociatedTokenAccountAddress: senderAta.toBase58(),
    recipientDescriptor: await resolveRecipientDescriptor(
      api,
      intent.recipient,
      mintAddress,
      resolvedProgram,
    ),
    amount: Number(intent.amount),
    mintAddress,
    mintDecimals,
    tokenId: mintAddress,
    memo,
    tokenProgram: resolvedProgram,
  };

  // Token-2022 tokens may have a transfer-fee extension that requires the
  // instruction to include the calculated fee. Two code paths:
  //
  //  • Normal send: `calculateToken2022TransferFees` takes the NET amount the
  //    recipient should receive and computes `transferAmountIncludingFee` (> net).
  //
  //  • Send all: `computeTransferFeeFromTotal` takes the TOTAL balance
  //    (= amount deducted from ATA) and derives the fee from that total, so
  //    `transferAmountIncludingFee == balance` and the instruction won't exceed
  //    the sender's holdings.
  if (resolvedProgram === PARSED_PROGRAMS.SPL_TOKEN_2022) {
    const transferFeeConfigExt = mintAccount.extensions?.find(
      (ext): ext is TransferFeeConfigExt => ext.extension === "transferFeeConfig",
    );
    if (transferFeeConfigExt) {
      const { epoch } = await api.getEpochInfo();
      command.extensions = {
        transferFee: transferFeeForIntent(
          intent.amount,
          intent.useAllAmount,
          transferFeeConfigExt.state,
          epoch,
        ),
      };
    }
  }

  return command;
}
