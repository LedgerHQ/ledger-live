import { ChainAPI } from "./network";
import { Transaction } from "./types";
import {
  DecodedTransferInstruction,
  PublicKey,
  SystemInstruction,
  SystemProgram,
  StakeProgram,
  VoteProgram,
  ComputeBudgetProgram,
  VersionedMessage,
  VersionedTransaction,
  CreateAccountParams,
  AssignParams,
  CreateAccountWithSeedParams,
  AdvanceNonceParams,
  WithdrawNonceParams,
  InitializeNonceParams,
  AuthorizeNonceParams,
  AllocateParams,
  AllocateWithSeedParams,
  AssignWithSeedParams,
  DecodedTransferWithSeedInstruction,
  InitializeAccountParams,
  AuthorizeVoteParams,
  AuthorizeVoteWithSeedParams,
  WithdrawFromVoteAccountParams,
  InitializeStakeParams,
  DelegateStakeParams,
  AuthorizeStakeParams,
  AuthorizeWithSeedStakeParams,
  SplitStakeParams,
  MergeStakeParams,
  WithdrawStakeParams,
  DeactivateStakeParams,
  RequestUnitsParams,
  RequestHeapFrameParams,
  SetComputeUnitLimitParams,
  SetComputeUnitPriceParams,
  TransactionMessage,
  TransactionInstruction,
  StakeInstruction,
  ComputeBudgetInstruction,
} from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID as TOKEN_PROGRAM_ID_PUBKEY,
  TOKEN_2022_PROGRAM_ID as TOKEN_2022_PROGRAM_ID_PUBKEY,
  ASSOCIATED_TOKEN_PROGRAM_ID as ASSOCIATED_TOKEN_PROGRAM_ID_PUBKEY,
  DecodedInstruction as SPLTokenDecodedInstruction,
  decodeInstruction as splTokenDecodeInstruction,
} from "@solana/spl-token";
import BigNumber from "bignumber.js";

const SYSTEM_PROGRAM_ID = SystemProgram.programId.toBase58();
const STAKE_PROGRAM_ID = StakeProgram.programId.toBase58();
const VOTE_PROGRAM_ID = VoteProgram.programId.toBase58();
const TOKEN_PROGRAM_ID = TOKEN_PROGRAM_ID_PUBKEY.toBase58();
const TOKEN_2022_PROGRAM_ID = TOKEN_2022_PROGRAM_ID_PUBKEY.toBase58();
const ASSOCIATED_TOKEN_PROGRAM_ID = ASSOCIATED_TOKEN_PROGRAM_ID_PUBKEY.toBase58();
const COMPUTE_BUDGET_PROGRAM_ID = ComputeBudgetProgram.programId.toBase58();

const MEMO_PROGRAM_ID = "MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr";

// https://docs.phantom.com/resources/faq#why-does-phantom-prepend-an-additional-instruction-on-standard-spl-token-transfers
// https://github.com/LedgerHQ/app-solana/blob/develop/libsol/serum_assert_owner_instruction.c#L8
const SERUM_ASSERT_OWNER_PHANTOM_PROGRAM_ID = "DeJBGdMFa1uynnnKiwrVioatTuHmNLpyFKnmB5kaFdzQ";
const SERUM_ASSERT_OWNER_PROGRAM_ID = "4MNPdKu9wFMvEeZBMt3Eipfs5ovVWTJb31pEXDJAAxX5";

function decodeSystemInstruction(instruction: TransactionInstruction): DecodedSystemInstruction {
  switch (SystemInstruction.decodeInstructionType(instruction)) {
    case "AdvanceNonceAccount":
      return SystemInstruction.decodeNonceAdvance(instruction);
    case "Allocate":
      return SystemInstruction.decodeAllocate(instruction);
    case "AllocateWithSeed":
      return SystemInstruction.decodeAllocateWithSeed(instruction);
    case "Assign":
      return SystemInstruction.decodeAssign(instruction);
    case "AssignWithSeed":
      return SystemInstruction.decodeAssignWithSeed(instruction);
    case "AuthorizeNonceAccount":
      return SystemInstruction.decodeNonceAuthorize(instruction);
    case "Create":
      return SystemInstruction.decodeCreateAccount(instruction);
    case "CreateWithSeed":
      return SystemInstruction.decodeCreateWithSeed(instruction);
    case "InitializeNonceAccount":
      return SystemInstruction.decodeNonceInitialize(instruction);
    case "Transfer":
      return SystemInstruction.decodeTransfer(instruction);
    case "TransferWithSeed":
      return SystemInstruction.decodeTransferWithSeed(instruction);
    case "WithdrawNonceAccount":
      return SystemInstruction.decodeNonceWithdraw(instruction);
    case "UpgradeNonceAccount":
    default:
      throw Error("System instruction type not supported");
  }
}

function decodeStakeInstruction(instruction: TransactionInstruction): DecodedStakeInstruction {
  switch (StakeInstruction.decodeInstructionType(instruction)) {
    case "Authorize":
      return StakeInstruction.decodeAuthorize(instruction);
    case "AuthorizeWithSeed":
      return StakeInstruction.decodeAuthorizeWithSeed(instruction);
    case "Deactivate":
      return StakeInstruction.decodeDeactivate(instruction);
    case "Delegate":
      return StakeInstruction.decodeDelegate(instruction);
    case "Initialize":
      return StakeInstruction.decodeInitialize(instruction);
    case "Merge":
      return StakeInstruction.decodeMerge(instruction);
    case "Split":
      return StakeInstruction.decodeSplit(instruction);
    case "Withdraw":
      return StakeInstruction.decodeWithdraw(instruction);
    default:
      throw Error("Stake instruction type not supported");
  }
}

function decodeComputeBudgetInstruction(
  instruction: TransactionInstruction,
): DecodedComputeBudgetInstruction {
  switch (ComputeBudgetInstruction.decodeInstructionType(instruction)) {
    case "RequestHeapFrame":
      return ComputeBudgetInstruction.decodeRequestHeapFrame(instruction);
    case "RequestUnits":
      return ComputeBudgetInstruction.decodeRequestUnits(instruction);
    case "SetComputeUnitLimit":
      return ComputeBudgetInstruction.decodeSetComputeUnitLimit(instruction);
    case "SetComputeUnitPrice":
      return ComputeBudgetInstruction.decodeSetComputeUnitPrice(instruction);
    default:
      throw Error("ComputeBudget instruction type not supported");
  }
}

function decodeInstructions(message: VersionedMessage): DecodedInstructionWithProgramId[] {
  const transactionMessage = TransactionMessage.decompile(message);
  const instructions: DecodedInstructionWithProgramId[] = [];
  for (const instruction of transactionMessage.instructions) {
    const programId = instruction.programId.toBase58();
    switch (programId) {
      case SYSTEM_PROGRAM_ID:
        instructions.push({
          programId,
          decoded: decodeSystemInstruction(instruction),
        });
        break;
      case STAKE_PROGRAM_ID:
        instructions.push({
          programId,
          decoded: decodeStakeInstruction(instruction),
        });
        break;
      case TOKEN_PROGRAM_ID:
      case TOKEN_2022_PROGRAM_ID:
      case ASSOCIATED_TOKEN_PROGRAM_ID:
        instructions.push({
          programId,
          decoded: splTokenDecodeInstruction(instruction, instruction.programId),
        });
        break;
      case COMPUTE_BUDGET_PROGRAM_ID:
        instructions.push({
          programId,
          decoded: decodeComputeBudgetInstruction(instruction),
        });
        break;
      case VOTE_PROGRAM_ID:
      case MEMO_PROGRAM_ID:
      case SERUM_ASSERT_OWNER_PHANTOM_PROGRAM_ID:
      case SERUM_ASSERT_OWNER_PROGRAM_ID:
        break; // do nothing
      default:
        throw new Error("Unknown instruction");
    }
  }
  return instructions;
}

function buildTransferTransaction(
  raw: string,
  lamports: bigint,
  fromPubkey: PublicKey,
  toPubkey: PublicKey,
  estimatedFees: number | null,
): Transaction {
  return {
    raw,
    family: "solana",
    amount: BigNumber(lamports.toString()),
    recipient: String(toPubkey),
    model: {
      kind: "transfer",
      uiState: {},
      commandDescriptor: {
        command: {
          kind: "transfer",
          amount: Number(lamports),
          sender: String(fromPubkey),
          recipient: String(toPubkey),
        },
        fee: estimatedFees ?? 0,
        warnings: {},
        errors: {},
      },
    },
  };
}

function buildTokenTransferTransaction(
  raw: string,
  lamports: bigint,
  fromPubkey: PublicKey,
  toPubkey: PublicKey,
  estimatedFees: number | null,
): Transaction {
  return {
    raw,
    family: "solana",
    amount: BigNumber(lamports.toString()),
    recipient: String(toPubkey),
    model: {
      kind: "token.transfer",
      uiState: {},
      commandDescriptor: {
        command: {
          kind: "token.transfer",
          amount: Number(lamports),
          sender: String(fromPubkey),
          recipient: String(toPubkey),
        },
        fee: estimatedFees ?? 0,
        warnings: {},
        errors: {},
      },
    },
  };
}

function buildTokenCreateATATransaction(
  raw: string,
  lamports: bigint,
  fromPubkey: PublicKey,
  toPubkey: PublicKey,
  estimatedFees: number | null,
): Transaction {
  return {
    raw,
    family: "solana",
    amount: BigNumber(lamports.toString()),
    recipient: String(toPubkey),
    model: {
      kind: "token.createATA",
      uiState: {},
      commandDescriptor: {
        command: {
          kind: "token.createATA",
          amount: Number(lamports),
          sender: String(fromPubkey),
          recipient: String(toPubkey),
        },
        fee: estimatedFees ?? 0,
        warnings: {},
        errors: {},
      },
    },
  };
}

function buildTokenApproveTransaction(
  raw: string,
  lamports: bigint,
  fromPubkey: PublicKey,
  toPubkey: PublicKey,
  estimatedFees: number | null,
): Transaction {
  return {
    raw,
    family: "solana",
    amount: BigNumber(lamports.toString()),
    recipient: String(toPubkey),
    model: {
      kind: "token.approve",
      uiState: {},
      commandDescriptor: {
        command: {
          kind: "token.approve",
          amount: Number(lamports),
          sender: String(fromPubkey),
          recipient: String(toPubkey),
        },
        fee: estimatedFees ?? 0,
        warnings: {},
        errors: {},
      },
    },
  };
}

function buildTokenRevokeTransaction(
  raw: string,
  lamports: bigint,
  fromPubkey: PublicKey,
  toPubkey: PublicKey,
  estimatedFees: number | null,
): Transaction {
  return {
    raw,
    family: "solana",
    amount: BigNumber(lamports.toString()),
    recipient: String(toPubkey),
    model: {
      kind: "token.revoke",
      uiState: {},
      commandDescriptor: {
        command: {
          kind: "token.revoke",
          amount: Number(lamports),
          sender: String(fromPubkey),
          recipient: String(toPubkey),
        },
        fee: estimatedFees ?? 0,
        warnings: {},
        errors: {},
      },
    },
  };
}

function buildStakeCreateAccountTransaction(
  raw: string,
  lamports: bigint,
  fromPubkey: PublicKey,
  toPubkey: PublicKey,
  estimatedFees: number | null,
): Transaction {
  return {
    raw,
    family: "solana",
    amount: BigNumber(lamports.toString()),
    recipient: String(toPubkey),
    model: {
      kind: "stake.createAccount",
      uiState: {},
      commandDescriptor: {
        command: {
          kind: "stake.createAccount",
          amount: Number(lamports),
          sender: String(fromPubkey),
          recipient: String(toPubkey),
        },
        fee: estimatedFees ?? 0,
        warnings: {},
        errors: {},
      },
    },
  };
}

function buildStakeDelegateTransaction(
  raw: string,
  lamports: bigint,
  fromPubkey: PublicKey,
  toPubkey: PublicKey,
  estimatedFees: number | null,
): Transaction {
  return {
    raw,
    family: "solana",
    amount: BigNumber(lamports.toString()),
    recipient: String(toPubkey),
    model: {
      kind: "stake.delegate",
      uiState: {},
      commandDescriptor: {
        command: {
          kind: "stake.delegate",
          amount: Number(lamports),
          sender: String(fromPubkey),
          recipient: String(toPubkey),
        },
        fee: estimatedFees ?? 0,
        warnings: {},
        errors: {},
      },
    },
  };
}

function buildStakeUndelegateTransaction(
  raw: string,
  lamports: bigint,
  authorizedPubkey: PublicKey,
  stakePubkey: PublicKey,
  estimatedFees: number | null,
): Transaction {
  const stakeAccAddr = String(stakePubkey);
  return {
    raw,
    family: "solana",
    amount: BigNumber(lamports.toString()),
    recipient: stakeAccAddr,
    model: {
      kind: "stake.undelegate",
      uiState: {
        stakeAccAddr,
      },
      commandDescriptor: {
        command: {
          kind: "stake.undelegate",
          authorizedAccAddr: String(authorizedPubkey),
          stakeAccAddr,
        },
        fee: estimatedFees ?? 0,
        warnings: {},
        errors: {},
      },
    },
  };
}

function buildStakeWithdrawTransaction(
  raw: string,
  lamports: bigint,
  fromPubkey: PublicKey,
  toPubkey: PublicKey,
  estimatedFees: number | null,
): Transaction {
  return {
    raw,
    family: "solana",
    amount: BigNumber(lamports.toString()),
    recipient: String(toPubkey),
    model: {
      kind: "stake.withdraw",
      uiState: {},
      commandDescriptor: {
        command: {
          kind: "stake.withdraw",
          amount: Number(lamports),
          sender: String(fromPubkey),
          recipient: String(toPubkey),
        },
        fee: estimatedFees ?? 0,
        warnings: {},
        errors: {},
      },
    },
  };
}

function buildStakeSplitTransaction(
  raw: string,
  lamports: bigint,
  fromPubkey: PublicKey,
  toPubkey: PublicKey,
  estimatedFees: number | null,
): Transaction {
  return {
    raw,
    family: "solana",
    amount: BigNumber(lamports.toString()),
    recipient: String(toPubkey),
    model: {
      kind: "stake.split",
      uiState: {},
      commandDescriptor: {
        command: {
          kind: "stake.split",
          amount: Number(lamports),
          sender: String(fromPubkey),
          recipient: String(toPubkey),
        },
        fee: estimatedFees ?? 0,
        warnings: {},
        errors: {},
      },
    },
  };
}

function buildTransaction(
  raw: string,
  fee: number,
  instructions: DecodedInstructionWithProgramId[],
): Transaction {
  for (const instruction of instructions) {
    switch (instruction.programId) {
      case SYSTEM_PROGRAM_ID:
        return buildTransferTransaction(raw, fee, instruction.decoded);
      case STAKE_PROGRAM_ID:
        return buildStake(raw, fee, instruction.decoded);
      case TOKEN_PROGRAM_ID:
      case TOKEN_2022_PROGRAM_ID:
        return buildTokenTransferTransaction(raw, fee, instruction.decoded);
      case ASSOCIATED_TOKEN_PROGRAM_ID:
        return buildTokenCreateATATransaction(raw, fee, instruction.decoded);
      case COMPUTE_BUDGET_PROGRAM_ID:
        break;
      case MEMO_PROGRAM_ID:
      case SERUM_ASSERT_OWNER_PHANTOM_PROGRAM_ID:
      case SERUM_ASSERT_OWNER_PROGRAM_ID:
      case VOTE_PROGRAM_ID:
        break; // do nothing
      default:
        throw new Error("Unknown instruction");
    }
  }
}

export async function toLiveTransaction(
  api: ChainAPI,
  serializedTransaction: string,
): Promise<Transaction> {
  const solanaTransaction = VersionedTransaction.deserialize(
    Buffer.from(serializedTransaction, "base64"),
  );

  console.log(solanaTransaction.message);

  const instructions = decodeInstructions(solanaTransaction.message);

  console.log(instructions);

  const estimatedFees = await api.getFeeForMessage(solanaTransaction.message);

  return buildTransaction(serializedTransaction, estimatedFees ?? 0, instructions);
}

// Types used in the app
//
// System
//
// SystemCreateAccount
// SystemAssign
// SystemTransfer
// SystemCreateAccountWithSeed
// SystemAdvanceNonceAccount
// SystemWithdrawNonceAccount
// SystemInitializeNonceAccount
// SystemAuthorizeNonceAccount
// SystemAllocate
// SystemAllocateWithSeed
// SystemAssignWithSeed
//
// Stake
//
// StakeInitialize
// StakeAuthorize
// StakeDelegate
// StakeSplit
// StakeWithdraw
// StakeDeactivate
// StakeSetLockup
// StakeMerge
// StakeAuthorizeWithSeed
// StakeInitializeChecked
// StakeAuthorizeChecked
// StakeAuthorizeCheckedWithSeed
// StakeSetLockupChecked
//
// Vote
// VoteInitialize
// VoteAuthorize
// VoteVote
// VoteWithdraw
// VoteUpdateValidatorId
// VoteUpdateCommission
// VoteSwitchVote
// VoteAuthorizeChecked
//
// SPL Token
//
// SplTokenKind(InitializeMint)
// SplTokenKind(InitializeAccount)
// SplTokenKind(InitializeAccount2)
// SplTokenKind(InitializeMultisig)
// SplTokenKind(TransferChecked)
// SplTokenKind(ApproveChecked)
// SplTokenKind(Revoke)
// SplTokenKind(SetAuthority)
// SplTokenKind(MintToChecked)
// SplTokenKind(BurnChecked)
// SplTokenKind(CloseAccount)
// SplTokenKind(FreezeAccount)
// SplTokenKind(ThawAccount)
// SplTokenKind(SyncNative)
//
// SPL Token2022 extensions
//
// SplTokenExtensionKind(TransferFeeExtension)
// SplTokenExtensionKind(ConfidentialTransferExtension)
// SplTokenExtensionKind(DefaultAccountStateExtension)
// SplTokenExtensionKind(MemoTransferExtension)
// SplTokenExtensionKind(InterestBearingMintExtension)
// SplTokenExtensionKind(CpiGuardExtension)
// SplTokenExtensionKind(TransferHookExtension)
// SplTokenExtensionKind(ConfidentialTransferFeeExtension)
// SplTokenExtensionKind(MetadataPointerExtension)
// SplTokenExtensionKind(GroupPointerExtension)
// SplTokenExtensionKind(GroupMemberPointerExtension)
//
// SPL Deprecated
//
// SplTokenKind(Transfer)
// SplTokenKind(Approve)
// SplTokenKind(MintTo)
// SplTokenKind(Burn)
//
// SPL ATA
//
// create_spl_associated_token_account
//
// ComputeBudget
//
// ComputeBudgetRequestHeapFrame
// ComputeBudgetChangeUnitLimit
// ComputeBudgetChangeUnitPrice
// ComputeBudgetSetLoadedAccountsDataSizeLimit

type DecodedSystemInstruction =
  | CreateAccountParams
  | AssignParams
  | DecodedTransferInstruction
  | CreateAccountWithSeedParams
  | AdvanceNonceParams
  | WithdrawNonceParams
  | InitializeNonceParams
  | AuthorizeNonceParams
  | AllocateParams
  | AllocateWithSeedParams
  | AssignWithSeedParams
  | DecodedTransferWithSeedInstruction;

type DecodedStakeInstruction =
  | InitializeStakeParams
  | DelegateStakeParams
  | AuthorizeStakeParams
  | AuthorizeWithSeedStakeParams
  | SplitStakeParams
  | MergeStakeParams
  | WithdrawStakeParams
  | DeactivateStakeParams;

type DecodedVoteInstruction =
  | InitializeAccountParams
  | AuthorizeVoteParams
  | AuthorizeVoteWithSeedParams
  | WithdrawFromVoteAccountParams;

type DecodedComputeBudgetInstruction =
  | RequestUnitsParams
  | RequestHeapFrameParams
  | SetComputeUnitLimitParams
  | SetComputeUnitPriceParams;

type DecodedInstruction =
  | DecodedSystemInstruction
  | DecodedStakeInstruction
  | DecodedVoteInstruction
  | DecodedComputeBudgetInstruction
  | SPLTokenDecodedInstruction;

type DecodedInstructionWithProgramId = {
  programId: string;
  decoded: DecodedInstruction;
};
