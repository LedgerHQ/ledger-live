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
import BigNumber from "bignumber.js";
import { bpsToPercent, calculateToken2022TransferFees } from "../helpers/token";
import { isValidBase58Address } from "../logic";
import type { ChainAPI } from "../network";
import type {
  TransferFeeConfigExt,
  TransferFeeConfigState,
} from "../network/chain/account/tokenExtensions";
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
  getMaybeMintAccount,
  getMaybeTokenAccount,
  getMaybeTokenMintProgram,
  getStakeAccountAddressWithSeed,
  getStakeAccountMinimumBalanceForRentExemption,
} from "../network/chain/web3";
import { UserInputType } from "../signer";
import { createStakeAccountSeed } from "../stakeAccountSeed";
import type {
  Command,
  StakeCreateAccountCommand,
  StakeDelegateCommand,
  StakeUndelegateCommand,
  StakeWithdrawCommand,
  TokenTransferCommand,
  TransferCommand,
  TransferFeeCalculated,
  Transaction,
  SolanaTokenProgram,
} from "../types";
import { assertUnreachable, DUMMY_SIGNATURE } from "../utils";

// ---------------------------------------------------------------------------
// Alpaca API: craft a transaction from a TransactionIntent
// ---------------------------------------------------------------------------

export async function craftTransaction(
  api: ChainAPI,
  intent: TransactionIntent<StringMemo | MemoNotSupported> | StakingTransactionIntent,
  customFees?: FeeEstimation,
): Promise<CraftedTransaction> {
  if (!isValidBase58Address(intent.sender)) {
    throw new Error("Invalid sender address");
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

  return craftSendTransactionFromIntent(api, intent, customFees);
}

async function craftWithdrawTransaction(
  api: ChainAPI,
  intent: StakingTransactionIntent,
  customFees?: FeeEstimation,
): Promise<CraftedTransaction> {
  const command: StakeWithdrawCommand = {
    kind: "stake.withdraw",
    authorizedAccAddr: intent.sender,
    stakeAccAddr: intent.recipient,
    toAccAddr: intent.sender,
    amount: Number(intent.amount),
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
  const seed = createStakeAccountSeed();
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
  const stakeAccAddr = "memo" in intent ? intent.memo.value : intent.recipient;
  if (!stakeAccAddr) {
    throw new Error("stake.delegate requires a stake account address (via recipient)");
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

  const command: TokenTransferCommand = {
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
      if (intent.useAllAmount) {
        command.extensions = {
          transferFee: computeTransferFeeFromTotal(
            intent.amount.toString(),
            transferFeeConfigExt.state,
            epoch,
          ),
        };
      } else {
        command.extensions = {
          transferFee: calculateToken2022TransferFees({
            transferAmount: Number(intent.amount),
            transferFeeConfigState: transferFeeConfigExt.state,
            currentEpoch: epoch,
          }),
        };
      }
    }
  }

  return command;
}

/**
 * Computes Token-2022 transfer fees for the "send all" case.
 *
 * Unlike `calculateToken2022TransferFees` which works from net → gross, this
 * function works from gross → net: the total deducted from the sender's ATA
 * equals the full token balance, and the fee is derived from that total.
 *
 * Formula: `fee = min( ceil(total × bps / 10 000), maximumFee )`
 *
 * Selects the active fee schedule based on `currentEpoch` vs the
 * `newerTransferFee.epoch` threshold.
 */
function computeTransferFeeFromTotal(
  totalAmount: BigNumber.Value,
  config: Pick<TransferFeeConfigState, "newerTransferFee" | "olderTransferFee">,
  currentEpoch: number,
): TransferFeeCalculated {
  const { newerTransferFee, olderTransferFee } = config;
  const feeConfig = currentEpoch >= newerTransferFee.epoch ? newerTransferFee : olderTransferFee;
  const { maximumFee, transferFeeBasisPoints } = feeConfig;
  const feePercent = bpsToPercent(transferFeeBasisPoints);

  const totalBn = BigNumber(totalAmount);
  const maxFeeBn = BigNumber(maximumFee);
  let transferFeeBn = totalBn
    .times(transferFeeBasisPoints)
    .div(10000)
    .decimalPlaces(0, BigNumber.ROUND_CEIL);
  if (transferFeeBn.gt(maxFeeBn)) {
    transferFeeBn = maxFeeBn;
  }

  return {
    feePercent,
    maxTransferFee: maximumFee,
    transferFee: transferFeeBn.toNumber(),
    feeBps: transferFeeBasisPoints,
    transferAmountIncludingFee: totalBn.toNumber(),
    transferAmountExcludingFee: totalBn.minus(transferFeeBn).toNumber(),
  };
}
