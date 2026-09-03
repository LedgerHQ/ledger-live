import type {
  FeeEstimation,
  MemoNotSupported,
  StringMemo,
  TransactionIntent,
} from "@ledgerhq/coin-module-framework/api/index";
import { log } from "@ledgerhq/logs";
import { VersionedTransaction as OnChainTransaction } from "@solana/web3.js";
import BigNumber from "bignumber.js";
import { isSolanaStakingTransactionIntent } from "../logic";
import { ChainAPI } from "../network";
import { PARSED_PROGRAMS } from "../network/chain/program/constants";
import {
  getMaybeTokenMint,
  getStakeAccountAddressWithSeed,
  getStakeAccountMinimumBalanceForRentExemption,
  type ParsedOnChainMintWithInfo,
} from "../network/chain/web3";
import type { TransferFeeConfigExt } from "../network/chain/account/tokenExtensions";
import { getAtaDataLengthForMint, transferFeeForIntent } from "../helpers/token";
import { UserInputType } from "../signer";
import type {
  SolanaTokenProgram,
  SolanaTxData,
  TokenTransferCommand,
  Transaction,
  TransactionModel,
  TransferFeeCalculated,
} from "../types";
import { LEDGER_VALIDATOR_DEFAULT, assertUnreachable } from "../utils";
import { buildVersionedTransaction, resolveRecipientDescriptor } from "./craftTransaction";
import { findAssociatedTokenAccountPubkey } from "../network/chain/web3";

const DEFAULT_TX_FEE = 5000;

const BASE_TRANSACTION: Transaction = {
  family: "solana",
  amount: new BigNumber(0),
  useAllAmount: false,
  recipient: "",
  model: { kind: "transfer", uiState: {} },
};

/**
 *
 * @param api - The Solana API client
 * @param intent - The transaction intent
 * @param _customFeesParameters - The custom fees parameters (not used in this implementation)
 * @returns The estimated fees as a FeeEstimation object
 */
export async function estimateFees(
  api: ChainAPI,
  intent: TransactionIntent<StringMemo | MemoNotSupported> & { data?: { type: string } },
  _customFeesParameters?: FeeEstimation["parameters"],
): Promise<FeeEstimation> {
  // A partner-built transaction is measured as-is; there is nothing to derive from the intent.
  if (intent.data?.type === "solana") {
    const { raw } = intent.data as SolanaTxData;
    const message = OnChainTransaction.deserialize(Buffer.from(raw, "base64")).message;
    return { value: BigInt((await api.getFeeForMessage(message)) ?? DEFAULT_TX_FEE) };
  }

  const kind = mapIntentToTxKind(intent);
  const fee = await estimateTxFee(api, intent.sender, kind);

  // The token-authority commands act on the owner's own associated account, and the device names it
  // -- it is derived from the chain, so the wallet cannot work it out on its own.
  if (TOKEN_AUTHORITY_TYPES.has(intent.type)) {
    const ownerTokenAccount = await ownerAssociatedTokenAccount(api, intent);
    return {
      value: BigInt(fee),
      ...(ownerTokenAccount ? { parameters: { ownerTokenAccount } } : {}),
    };
  }

  // Creating a stake account costs its rent on top of the delegated amount, and that is the sum the
  // device shows -- so the wallet has to know it to display the same figure.
  if (kind === "stake.createAccount") {
    return {
      value: BigInt(fee),
      parameters: {
        stakeAccountRent: BigInt(await getStakeAccountMinimumBalanceForRentExemption(api)),
      },
    };
  }

  // The mint is the only authority on a token's transfer fee: `asset.type` comes from the CAL id,
  // which spells every Solana token `spl` -- Token-2022 ones included.
  const mint = await getMaybeMintOfIntent(api, intent);
  const transferFee = mint && (await getMaybeTransferFee(api, intent, mint));
  const ataRent = mint ? await recipientAtaRent(api, intent, mint) : 0n;
  return {
    value: BigInt(fee) + ataRent,
    ...(transferFee ? { parameters: { transferFee } } : {}),
  };
}

/**
 * Rent for the recipient's associated token account, when the transfer has to create it. It is not
 * a network fee, but it leaves the sender's account all the same, and the legacy bridge reported it
 * here (`prepareTransaction.ts` returned `fee + assocAccRentExempt`) -- leaving it out understates
 * the cost by roughly 2M lamports on the confirmation screen.
 */
async function recipientAtaRent(
  api: ChainAPI,
  intent: TransactionIntent<StringMemo | MemoNotSupported>,
  mint: ParsedOnChainMintWithInfo,
): Promise<bigint> {
  if (!intent.recipient) return 0n;
  const mintAddress = "assetReference" in intent.asset ? intent.asset.assetReference : undefined;
  if (!mintAddress) return 0n;

  const descriptor = await resolveRecipientDescriptor(
    api,
    intent.recipient,
    mintAddress,
    tokenProgramOfMint(mint),
  );
  if (!descriptor.shouldCreateAsAssociatedTokenAccount) return 0n;

  return BigInt(await api.getMinimumBalanceForRentExemption(getAtaDataLengthForMint(mint)));
}

/** The mint an intent transfers, when it transfers a token at all. */
async function getMaybeMintOfIntent(
  api: ChainAPI,
  intent: TransactionIntent<StringMemo | MemoNotSupported>,
): Promise<ParsedOnChainMintWithInfo | undefined> {
  const mintAddress = "assetReference" in intent.asset ? intent.asset.assetReference : undefined;
  if (intent.asset.type === "native" || !mintAddress) return undefined;

  const mint = await getMaybeTokenMint(mintAddress, api);
  return !mint || mint instanceof Error ? undefined : mint;
}

function tokenProgramOfMint(mint: ParsedOnChainMintWithInfo): SolanaTokenProgram {
  return mint.onChainAcc.data.program === PARSED_PROGRAMS.SPL_TOKEN_2022
    ? PARSED_PROGRAMS.SPL_TOKEN_2022
    : PARSED_PROGRAMS.SPL_TOKEN;
}

/** The fee a Token-2022 mint levies on transfers; it changes at epoch boundaries. */
async function getMaybeTransferFee(
  api: ChainAPI,
  intent: TransactionIntent<StringMemo | MemoNotSupported>,
  mint: ParsedOnChainMintWithInfo,
): Promise<TransferFeeCalculated | undefined> {
  const transferFeeConfigExt = mint.info.extensions?.find(
    tokenExt => tokenExt.extension === "transferFeeConfig",
  ) as TransferFeeConfigExt | undefined;
  if (!transferFeeConfigExt) return undefined;

  const { epoch } = await api.getEpochInfo();
  return transferFeeForIntent(
    intent.amount,
    intent.useAllAmount,
    transferFeeConfigExt.state,
    epoch,
  );
}

export async function estimateTxFee(
  api: ChainAPI,
  address: string,
  kind: TransactionModel["kind"],
  tokenProgram?: SolanaTokenProgram,
) {
  const tx = await createDummyTx(address, kind, tokenProgram);
  const [onChainTx] = await buildVersionedTransaction(address, tx, api);

  let fee = await api.getFeeForMessage(onChainTx.message);

  if (typeof fee !== "number") {
    log("debug", `Solana api.getFeeForMessage returned invalid fee: <${fee}>`);
    fee = await retryWithNewBlockhash(api, onChainTx);
  }

  if (typeof fee !== "number") {
    log(
      "error",
      `Solana unexpected fee: <${fee}>, after retry with a new blockhash. Fallback to the default.`,
    );
    fee = DEFAULT_TX_FEE;
  }
  return fee;
}

const createDummyTx = (
  address: string,
  kind: TransactionModel["kind"],
  tokenProgram?: SolanaTokenProgram,
) => {
  switch (kind) {
    case "transfer":
      return createDummyTransferTx(address);
    case "stake.createAccount":
      return createDummyStakeCreateAccountTx(address);
    case "stake.delegate":
      return createDummyStakeDelegateTx(address);
    case "stake.undelegate":
      return createDummyStakeUndelegateTx(address);
    case "stake.withdraw":
      return createDummyStakeWithdrawTx(address);
    case "token.transfer":
      return createDummyTokenTransferTx(address, tokenProgram);
    case "token.approve":
      return createDummyTokenApproveTx(address);
    case "token.revoke":
      return createDummyTokenRevokeTx(address);
    case "stake.split":
    case "token.createATA":
    case "raw":
      throw new Error(`not implemented for <${kind}>`);
    default:
      return assertUnreachable(kind);
  }
};

const createDummyTransferTx = (address: string): Transaction => {
  return {
    ...BASE_TRANSACTION,
    model: {
      kind: "transfer",
      uiState: {},
      commandDescriptor: {
        command: {
          kind: "transfer",
          amount: 0,
          recipient: address,
          sender: address,
        },
        ...commandDescriptorCommons,
      },
    },
  };
};

const createDummyStakeCreateAccountTx = async (address: string): Promise<Transaction> => {
  return {
    ...BASE_TRANSACTION,
    model: {
      kind: "stake.createAccount",
      uiState: {} as any,
      commandDescriptor: {
        command: {
          kind: "stake.createAccount",
          amount: 0,
          delegate: {
            voteAccAddress: LEDGER_VALIDATOR_DEFAULT.voteAccount,
          },
          fromAccAddress: address,
          seed: "",
          stakeAccAddress: await getStakeAccountAddressWithSeed({ fromAddress: address, seed: "" }),
          stakeAccRentExemptAmount: 2282880,
        },
        ...commandDescriptorCommons,
      },
    },
  };
};

const createDummyStakeDelegateTx = (address: string): Transaction => {
  return {
    ...BASE_TRANSACTION,
    model: {
      kind: "stake.delegate",
      uiState: {} as any,
      commandDescriptor: {
        command: {
          kind: "stake.delegate",
          authorizedAccAddr: address,
          stakeAccAddr: randomAddresses[0],
          voteAccAddr: randomAddresses[1],
        },
        ...commandDescriptorCommons,
      },
    },
  };
};

const createDummyStakeUndelegateTx = (address: string): Transaction => {
  return {
    ...BASE_TRANSACTION,
    model: {
      kind: "stake.undelegate",
      uiState: {} as any,
      commandDescriptor: {
        command: {
          kind: "stake.undelegate",
          authorizedAccAddr: address,
          stakeAccAddr: randomAddresses[0],
        },
        ...commandDescriptorCommons,
      },
    },
  };
};

const createDummyStakeWithdrawTx = (address: string): Transaction => {
  return {
    ...BASE_TRANSACTION,
    model: {
      kind: "stake.withdraw",
      uiState: {} as any,
      commandDescriptor: {
        command: {
          kind: "stake.withdraw",
          amount: 0,
          authorizedAccAddr: address,
          stakeAccAddr: randomAddresses[0],
          toAccAddr: address,
        },
        ...commandDescriptorCommons,
      },
    },
  };
};

// Callers must leave `tokenProgram` at its default: the Token-2022 branch resolves the mint on
// chain, and this transaction carries a random one. It exists only to be measured, and the fee
// Solana quotes is per signature, so the instruction variant does not change it anyway.
const createDummyTokenTransferTx = (
  address: string,
  tokenProgram: SolanaTokenProgram = PARSED_PROGRAMS.SPL_TOKEN,
): Transaction => {
  const command: TokenTransferCommand = {
    kind: "token.transfer",
    amount: 0,
    mintAddress: randomAddresses[0],
    mintDecimals: 0,
    tokenId: "",
    ownerAddress: address,
    ownerAssociatedTokenAccountAddress: randomAddresses[1],
    recipientDescriptor: {
      walletAddress: randomAddresses[1],
      tokenAccAddress: randomAddresses[2],
      shouldCreateAsAssociatedTokenAccount: true,
      userInputType: UserInputType.SOL,
    },
    tokenProgram,
  };

  // Token-2022 tokens with a transfer-fee extension use a different
  // instruction (transferCheckedWithFee) that consumes more compute units.
  // Include a dummy transferFee so buildTokenTransferInstructions picks the
  // right instruction variant for fee estimation.
  if (tokenProgram === PARSED_PROGRAMS.SPL_TOKEN_2022) {
    command.extensions = {
      transferFee: {
        feePercent: 0,
        maxTransferFee: 0,
        transferFee: 0,
        feeBps: 0,
        transferAmountIncludingFee: 0,
        transferAmountExcludingFee: 0,
      },
    };
  }

  return {
    ...BASE_TRANSACTION,
    model: {
      kind: "token.transfer",
      uiState: {} as any,
      commandDescriptor: {
        command,
        ...commandDescriptorCommons,
      },
    },
  };
};

const createDummyTokenApproveTx = (address: string): Transaction => {
  return {
    ...BASE_TRANSACTION,
    model: {
      kind: "token.approve",
      uiState: {} as any,
      commandDescriptor: {
        command: {
          kind: "token.approve",
          account: randomAddresses[0],
          mintAddress: randomAddresses[1],
          recipientDescriptor: {
            walletAddress: randomAddresses[1],
            tokenAccAddress: randomAddresses[2],
            shouldCreateAsAssociatedTokenAccount: true,
            userInputType: UserInputType.SOL,
          },
          owner: address,
          amount: 0,
          decimals: 0,
          tokenProgram: PARSED_PROGRAMS.SPL_TOKEN,
        },
        ...commandDescriptorCommons,
      },
    },
  };
};

const createDummyTokenRevokeTx = (address: string): Transaction => {
  return {
    ...BASE_TRANSACTION,
    model: {
      kind: "token.revoke",
      uiState: {} as any,
      commandDescriptor: {
        command: {
          kind: "token.revoke",
          account: randomAddresses[0],
          owner: address,
          tokenProgram: PARSED_PROGRAMS.SPL_TOKEN,
        },
        ...commandDescriptorCommons,
      },
    },
  };
};

const commandDescriptorCommons = {
  errors: {},
  fee: 0,
  warnings: {},
};

const randomAddresses = [
  "HxCvgjSbF8HMt3fj8P3j49jmajNCMwKAqBu79HUDPtkM",
  "AjmMiagw33Ad4WdPR3y2QWsDXaLxmsiSZEpMfpT1Q9uZ",
  "AVHhsobqNw3b3XD43fz7Crq3d3UxFYZfHAByh7ogZoeN",
  "FvbvvXMY4Rf1AtGG7UHJUesjt8FFgPnPy6o83Dna9mXK",
  "AEtRo9MKfLqGtjvxdz8H93R7SQxXLEkibVSJbs9XKnD1",
];

async function retryWithNewBlockhash(api: ChainAPI, onChainTx: OnChainTransaction) {
  if (onChainTx.message.recentBlockhash === undefined) {
    throw new Error("expected recentBlockhash");
  }

  onChainTx.message.recentBlockhash = await waitNextBlockhash(
    api,
    onChainTx.message.recentBlockhash,
  );

  return api.getFeeForMessage(onChainTx.message);
}

function sleep(durationMS: number): Promise<void> {
  return new Promise(res => setTimeout(res, durationMS));
}

async function waitNextBlockhash(api: ChainAPI, currentBlockhash: string) {
  const sleepTimeMS = 5000;
  for (let i = 0; i < 5; i++) {
    log("info", `sleeping for ${sleepTimeMS} ms, waiting for a new blockhash`);
    await sleep(sleepTimeMS);
    const blockhash = await api.getLatestBlockhash();
    if (blockhash.blockhash !== currentBlockhash) {
      log("info", "got a new blockhash");
      return blockhash.blockhash;
    }
    log("info", "got same blockhash");
  }

  throw new Error("next blockhash timeout");
}

const TOKEN_AUTHORITY_TYPES = new Set(["token.createATA", "token.approve", "token.revoke"]);

/** The associated token account the sender owns for the intent's mint. */
async function ownerAssociatedTokenAccount(
  api: ChainAPI,
  intent: TransactionIntent<StringMemo | MemoNotSupported>,
): Promise<string | undefined> {
  const mint = await getMaybeMintOfIntent(api, intent);
  const mintAddress = "assetReference" in intent.asset ? intent.asset.assetReference : undefined;
  if (!mint || !mintAddress) return undefined;

  const ata = await findAssociatedTokenAccountPubkey(
    intent.sender,
    mintAddress,
    tokenProgramOfMint(mint),
  );
  return ata.toBase58();
}

/** Kinds `createDummyTx` can build; the rest are measured as a plain transfer. */
const MEASURABLE_KINDS = new Set<string>([
  "transfer",
  "token.transfer",
  "token.approve",
  "token.revoke",
  "stake.createAccount",
  "stake.delegate",
  "stake.undelegate",
  "stake.withdraw",
]);

function mapIntentToTxKind(
  intent: TransactionIntent<StringMemo | MemoNotSupported>,
): TransactionModel["kind"] {
  // `stake.split` and `token.createATA` have no dummy transaction. Solana prices a transaction per
  // signature, so measuring them as a plain transfer costs the same answer.
  if (!MEASURABLE_KINDS.has(intent.type)) {
    return intent.asset.type === "native" ? "transfer" : "token.transfer";
  }
  if (isSolanaStakingTransactionIntent(intent) || intent.type.startsWith("token.")) {
    return intent.type as TransactionModel["kind"];
  }
  if (intent.asset.type !== "native") {
    return "token.transfer";
  }
  return "transfer";
}
