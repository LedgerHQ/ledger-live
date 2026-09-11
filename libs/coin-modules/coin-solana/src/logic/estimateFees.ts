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
import {
  buildVersionedTransaction,
  resolveRecipientDescriptor,
  stakeAccountSeedOfIntent,
} from "./craftTransaction";
import { ChainAPI } from "../network";
import { PARSED_PROGRAMS } from "../network/chain/program/constants";
import {
  findAssociatedTokenAccountPubkey,
  getMaybeTokenMint,
  getStakeAccountAddressWithSeed,
  getStakeAccountMinimumBalanceForRentExemption,
  type ParsedOnChainMintWithInfo,
} from "../network/chain/web3";
import type { TransferFeeConfigExt } from "../network/chain/account/tokenExtensions";
import {
  getAtaDataLengthForMint,
  transferFeeForIntent,
  tokenProgramOfMint,
} from "../helpers/token";
import { UserInputType } from "../signer";
import type {
  SolanaTokenProgram,
  SolanaTxData,
  TokenTransferCommand,
  Transaction,
  TransactionModel,
  TransferFeeCalculated,
} from "../types";
import {
  DUMMY_SIGNATURE,
  LEDGER_VALIDATOR_DEFAULT,
  ZERO_FILLED_DUMMY_SIGNATURE,
  assertUnreachable,
} from "../utils";

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
  const solanaData = intent.data?.type === "solana" ? (intent.data as SolanaTxData) : undefined;
  if (solanaData?.raw) {
    const { raw } = solanaData;
    let transaction: OnChainTransaction;
    try {
      transaction = OnChainTransaction.deserialize(Buffer.from(raw, "base64"));
    } catch {
      throw new Error("Invalid or unsupported raw transaction");
    }

    const { message } = transaction;
    // The framework reuses this value as `customFees`, so it must price what crafting will sign.
    const unsigned = transaction.signatures.every(sig => {
      const buf = Buffer.from(sig);
      return buf.equals(DUMMY_SIGNATURE) || buf.equals(ZERO_FILLED_DUMMY_SIGNATURE);
    });
    if (unsigned) {
      message.recentBlockhash = (await api.getLatestBlockhash()).blockhash;
    }

    return { value: BigInt((await api.getFeeForMessage(message)) ?? DEFAULT_TX_FEE) };
  }

  const kind = mapIntentToTxKind(intent);
  // `craftTransaction` reads the program off the mint, so the dummy has to be measured on it too.
  const mint = await getMaybeMintOfIntent(api, intent);
  const fee = await estimateTxFee(
    api,
    intent.sender,
    kind,
    mint ? tokenProgramOfMint(mint) : resolveTokenProgramFromAsset(intent.asset),
    // A Token-2022 transfer instruction reads the mint on chain, so the dummy needs the real one.
    "assetReference" in intent.asset ? intent.asset.assetReference : undefined,
  );

  if (TOKEN_AUTHORITY_TYPES.has(intent.type)) {
    const ownerTokenAccount = mint && (await ownerAssociatedTokenAccount(intent, mint));
    const ataRent = intent.type === "token.createATA" && mint ? await ownerAtaRent(api, mint) : 0n;
    return {
      value: BigInt(fee) + ataRent,
      ...(ownerTokenAccount ? { parameters: { ownerTokenAccount } } : {}),
    };
  }

  const opensStakeAccount = intent.type === "stake.createAccount" || intent.type === "stake.split";
  if (opensStakeAccount) {
    const isCreation = intent.type === "stake.createAccount";
    const seed = stakeAccountSeedOfIntent(intent);
    const [stakeAccountAddress, stakeAccountRent, reserve] = await Promise.all([
      seed ? getStakeAccountAddressWithSeed({ fromAddress: intent.sender, seed }) : undefined,
      isCreation ? getStakeAccountMinimumBalanceForRentExemption(api) : undefined,
      isCreation ? unstakeReserve(api, intent.sender) : 0n,
    ]);
    return {
      value: BigInt(fee),
      parameters: {
        ...(stakeAccountRent !== undefined
          ? {
              stakeAccountRent: BigInt(stakeAccountRent),
              reserve: BigInt(fee) + reserve,
            }
          : {}),
        ...(stakeAccountAddress ? { stakeAccountAddress } : {}),
      },
    };
  }

  const transferFee = mint && (await getMaybeTransferFee(api, intent, mint));
  const ataRent = mint ? await recipientAtaRent(api, intent, mint) : 0n;
  return {
    value: BigInt(fee) + ataRent,
    ...(transferFee ? { parameters: { transferFee } } : {}),
  };
}

/** Best-effort: a failure only makes send-max marginally less generous. */
export async function unstakeReserve(api: ChainAPI, sender: string): Promise<bigint> {
  try {
    const [undelegateFee, withdrawFee] = await Promise.all([
      estimateTxFee(api, sender, "stake.undelegate"),
      estimateTxFee(api, sender, "stake.withdraw"),
    ]);
    return BigInt(undelegateFee + withdrawFee);
  } catch {
    return 0n;
  }
}

async function ownerAtaRent(api: ChainAPI, mint: ParsedOnChainMintWithInfo): Promise<bigint> {
  return BigInt(await api.getMinimumBalanceForRentExemption(getAtaDataLengthForMint(mint)));
}

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

async function getMaybeMintOfIntent(
  api: ChainAPI,
  intent: TransactionIntent<StringMemo | MemoNotSupported>,
): Promise<ParsedOnChainMintWithInfo | undefined> {
  const mintAddress = "assetReference" in intent.asset ? intent.asset.assetReference : undefined;
  if (intent.asset.type === "native" || !mintAddress) return undefined;

  const mint = await getMaybeTokenMint(mintAddress, api);
  return !mint || mint instanceof Error ? undefined : mint;
}

function resolveTokenProgramFromAsset(
  asset: TransactionIntent["asset"],
): SolanaTokenProgram | undefined {
  if (asset.type === "native") return undefined;
  if (asset.type === PARSED_PROGRAMS.SPL_TOKEN_2022) return PARSED_PROGRAMS.SPL_TOKEN_2022;
  return PARSED_PROGRAMS.SPL_TOKEN;
}

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
  mintAddress?: string,
) {
  const tx = await createDummyTx(address, kind, tokenProgram, mintAddress);
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
  mintAddress?: string,
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
      return createDummyTokenTransferTx(address, tokenProgram, mintAddress);
    case "token.approve":
      return createDummyTokenApproveTx(address, tokenProgram);
    case "token.revoke":
      return createDummyTokenRevokeTx(address, tokenProgram);
    case "stake.split":
      return createDummyStakeSplitTx(address);
    case "token.createATA":
      return createDummyTokenCreateATATx(address, tokenProgram);
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

const createDummyTokenTransferTx = (
  address: string,
  tokenProgram: SolanaTokenProgram = PARSED_PROGRAMS.SPL_TOKEN,
  mintAddress: string = randomAddresses[0],
): Transaction => {
  const command: TokenTransferCommand = {
    kind: "token.transfer",
    amount: 0,
    mintAddress,
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

const createDummyStakeSplitTx = (address: string): Transaction => {
  return {
    ...BASE_TRANSACTION,
    model: {
      kind: "stake.split",
      uiState: {} as any,
      commandDescriptor: {
        command: {
          kind: "stake.split",
          authorizedAccAddr: address,
          stakeAccAddr: randomAddresses[0],
          amount: 0,
          seed: "",
          splitStakeAccAddr: randomAddresses[1],
        },
        ...commandDescriptorCommons,
      },
    },
  };
};

const createDummyTokenCreateATATx = (
  address: string,
  tokenProgram: SolanaTokenProgram = PARSED_PROGRAMS.SPL_TOKEN,
): Transaction => {
  return {
    ...BASE_TRANSACTION,
    model: {
      kind: "token.createATA",
      uiState: {} as any,
      commandDescriptor: {
        command: {
          kind: "token.createATA",
          owner: address,
          mint: randomAddresses[0],
          associatedTokenAccountAddress: randomAddresses[1],
          tokenProgram,
        },
        ...commandDescriptorCommons,
      },
    },
  };
};

const createDummyTokenApproveTx = (
  address: string,
  tokenProgram: SolanaTokenProgram = PARSED_PROGRAMS.SPL_TOKEN,
): Transaction => {
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
          tokenProgram,
        },
        ...commandDescriptorCommons,
      },
    },
  };
};

const createDummyTokenRevokeTx = (
  address: string,
  tokenProgram: SolanaTokenProgram = PARSED_PROGRAMS.SPL_TOKEN,
): Transaction => {
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
          tokenProgram,
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

async function ownerAssociatedTokenAccount(
  intent: TransactionIntent<StringMemo | MemoNotSupported>,
  mint: ParsedOnChainMintWithInfo,
): Promise<string | undefined> {
  const mintAddress = "assetReference" in intent.asset ? intent.asset.assetReference : undefined;
  if (!mintAddress) return undefined;

  const ata = await findAssociatedTokenAccountPubkey(
    intent.sender,
    mintAddress,
    tokenProgramOfMint(mint),
  );
  return ata.toBase58();
}

const MEASURABLE_KINDS = new Set<string>([
  "transfer",
  "token.transfer",
  "token.approve",
  "token.revoke",
  "stake.createAccount",
  "stake.delegate",
  "stake.undelegate",
  "stake.withdraw",
  "stake.split",
  "token.createATA",
]);

function mapIntentToTxKind(
  intent: TransactionIntent<StringMemo | MemoNotSupported>,
): TransactionModel["kind"] {
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
