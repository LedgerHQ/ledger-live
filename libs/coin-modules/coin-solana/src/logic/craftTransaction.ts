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
  PublicKey,
  VersionedTransaction,
  TransactionInstruction,
  TransactionMessage,
  BlockhashWithExpiryBlockHeight,
} from "@solana/web3.js";
import { transferFeeForIntent } from "../helpers/token";
import { isValidBase58Address } from "../logic";
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
  SolanaTxData,
} from "../types";
import { assertUnreachable, DUMMY_SIGNATURE, ZERO_FILLED_DUMMY_SIGNATURE } from "../utils";

// ---------------------------------------------------------------------------
// Coin Module API: craft a transaction from a TransactionIntent
// ---------------------------------------------------------------------------

export async function craftTransaction(
  api: ChainAPI,
  intent: (TransactionIntent<StringMemo | MemoNotSupported> | StakingTransactionIntent) & {
    data?: { type: string };
  },
  customFees?: FeeEstimation,
): Promise<CraftedTransaction> {
  if (!isValidBase58Address(intent.sender)) {
    throw new Error("Invalid sender address");
  }

  if (intent.data?.type === "solana") {
    const data = intent.data as SolanaTxData;
    if (data.raw) {
      return craftPrebuiltTransaction(api, { ...data, raw: data.raw }, intent.sender, customFees);
    }
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

/**
 * A transaction a partner already built: the bytes are the transaction, so nothing is derived from
 * the intent. Only the blockhash is refreshed, and only while the transaction is still unsigned —
 * mirroring what `buildVersionedTransaction` does for the same payload on the legacy path.
 */
async function craftPrebuiltTransaction(
  api: ChainAPI,
  data: SolanaTxData & { raw: string },
  sender: string,
  customFees?: FeeEstimation,
): Promise<CraftedTransaction> {
  let transaction: VersionedTransaction;
  try {
    transaction = VersionedTransaction.deserialize(Buffer.from(data.raw, "base64"));
  } catch {
    throw new Error("Invalid or unsupported raw transaction");
  }

  const feePayer = transaction.message.staticAccountKeys[0]?.toBase58();
  if (feePayer && feePayer !== sender) {
    throw new Error("Sender does not match transaction fee payer");
  }

  const recentBlockhash = await api.getLatestBlockhash();
  // Both fills mean "not signed yet" -- `signOperation.ts` reads them the same way. A partner's
  // transaction arrives zero-filled, so checking only `DUMMY_SIGNATURE` would leave it on a
  // blockhash that may already have expired.
  const unsigned = transaction.signatures.every(sig => {
    const buf = Buffer.from(sig);
    return buf.equals(DUMMY_SIGNATURE) || buf.equals(ZERO_FILLED_DUMMY_SIGNATURE);
  });
  if (unsigned) {
    transaction.message.recentBlockhash = recentBlockhash.blockhash;
  }

  const fee = customFees
    ? customFees.value
    : BigInt((await api.getFeeForMessage(transaction.message)) ?? 5000);

  return {
    transaction: Buffer.from(transaction.serialize()).toString("base64"),
    details: {
      recentBlockhash: transaction.message.recentBlockhash,
      lastValidBlockHeight: recentBlockhash.lastValidBlockHeight,
      estimatedFee: fee.toString(),
    },
  };
}

/**
 * Read live: withdrawing the synced amount off a grown account leaves a residue under the
 * rent-exempt reserve, which the stake program rejects. `undefined` if the account is gone.
 */
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
  const command: StakeWithdrawCommand = {
    kind: "stake.withdraw",
    authorizedAccAddr: intent.sender,
    stakeAccAddr: intent.recipient,
    toAccAddr: intent.sender,
    amount: withdrawable ?? Number(intent.amount),
  };
  const instructions = await buildInstructionsForCommand(api, command);
  const recentBlockhash = await api.getLatestBlockhash();

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
  // The framework always sets a memo, `{ type: "none" }` at worst, so a `"memo" in intent` guard
  // would never fall through -- read the value and let an absent one be the error.
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

/**
 * Splitting a stake account moves part of it into a new one, derived from a fresh seed here the
 * same way `stake.createAccount` derives its own.
 */
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

/**
 * Opening a token account, delegating spending authority over one, and taking that authority back.
 * Only a live app reaches these; no first-party screen builds them. The addresses the instructions
 * need are derived from the chain, exactly as the legacy `deriveCommandDescriptor` did -- the wallet
 * API carries only the token and the delegate.
 */
async function craftTokenAuthorityFromIntent(
  api: ChainAPI,
  intent: TransactionIntent<StringMemo | MemoNotSupported>,
  customFees?: FeeEstimation,
): Promise<CraftedTransaction> {
  const mintAddress = getTokenMintAddress(intent);
  if (!mintAddress) {
    throw new Error(`${intent.type} requires a token asset`);
  }

  const mint = await getMaybeTokenMint(mintAddress, api);
  if (!mint || mint instanceof Error) {
    throw new Error(`Cannot resolve mint account for ${mintAddress}`);
  }
  const tokenProgram: SolanaTokenProgram =
    mint.onChainAcc.data.program === PARSED_PROGRAMS.SPL_TOKEN_2022
      ? PARSED_PROGRAMS.SPL_TOKEN_2022
      : PARSED_PROGRAMS.SPL_TOKEN;

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

async function craftCommandToTransaction(
  api: ChainAPI,
  command: Command,
  payerKey: string,
  customFees?: FeeEstimation,
): Promise<CraftedTransaction> {
  const instructions = await buildInstructionsForCommand(api, command);
  const recentBlockhash = await api.getLatestBlockhash();
  const message = new TransactionMessage({
    payerKey: new PublicKey(payerKey),
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

export function stakeAccountSeedOfIntent(intent: unknown): string | undefined {
  const data = (intent as { data?: SolanaTxData } | undefined)?.data;
  return data?.type === "solana" ? data.stakeAccountSeed : undefined;
}

function getTokenMintAddress(intent: TransactionIntent): string | undefined {
  if (intent.asset.type === "native") return undefined;
  if ("assetReference" in intent.asset && intent.asset.assetReference) {
    return intent.asset.assetReference;
  }
  return undefined;
}

// The recipient may be a token account rather than a wallet: deriving an associated account from
// one throws `TokenOwnerOffCurveError`, an ATA being off the ed25519 curve.
export async function resolveRecipientDescriptor(
  api: ChainAPI,
  recipient: string,
  mintAddress: string,
  tokenProgram: SolanaTokenProgram,
): Promise<TokenTransferCommand["recipientDescriptor"]> {
  const recipientTokenAccount = await getMaybeTokenAccount(recipient, api);
  if (recipientTokenAccount && !(recipientTokenAccount instanceof Error)) {
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

  return {
    walletAddress: recipient,
    tokenAccAddress: associatedAddress,
    shouldCreateAsAssociatedTokenAccount:
      associatedAccount === undefined || associatedAccount instanceof Error,
    userInputType: UserInputType.SOL,
  };
}

async function resolveTokenTransferCommand(
  api: ChainAPI,
  intent: TransactionIntent,
  mintAddress: string,
  memo?: string,
): Promise<TokenTransferCommand> {
  // One read, not two: `getMaybeTokenMint` carries both the parsed mint and the program that owns
  // it, where `getMaybeMintAccount` and `getMaybeTokenMintProgram` each fetched the same account.
  const mint = await getMaybeTokenMint(mintAddress, api);
  if (!mint || mint instanceof Error) {
    throw new Error(`Cannot resolve mint account for ${mintAddress}`);
  }

  const mintAccount = mint.info;
  const resolvedProgram: SolanaTokenProgram =
    mint.onChainAcc.data.program === PARSED_PROGRAMS.SPL_TOKEN_2022
      ? PARSED_PROGRAMS.SPL_TOKEN_2022
      : PARSED_PROGRAMS.SPL_TOKEN;
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
