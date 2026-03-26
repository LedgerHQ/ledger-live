import type { FeeEstimation, TransactionIntent } from "@ledgerhq/coin-module-framework/api/index";
import { log } from "@ledgerhq/logs";
import { VersionedTransaction as OnChainTransaction } from "@solana/web3.js";
import BigNumber from "bignumber.js";
import { isSolanaStakingTransactionIntent } from "../logic";
import { ChainAPI } from "../network";
import { PARSED_PROGRAMS } from "../network/chain/program/constants";
import { getStakeAccountAddressWithSeed } from "../network/chain/web3";
import { UserInputType } from "../signer";
import type { SolanaTokenProgram, TokenTransferCommand } from "../types";
import { Transaction, TransactionModel } from "../types";
import { LEDGER_VALIDATOR_DEFAULT, assertUnreachable } from "../utils";
import { buildVersionedTransaction } from "./craftTransaction";

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
  intent: TransactionIntent,
  _customFeesParameters?: FeeEstimation["parameters"],
): Promise<FeeEstimation> {
  const kind = mapIntentToTxKind(intent);
  const tokenProgram = resolveTokenProgramFromAsset(intent.asset);
  const fee = await estimateTxFee(api, intent.sender, kind, tokenProgram);
  return { value: BigInt(fee) };
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

function mapIntentToTxKind(intent: TransactionIntent): TransactionModel["kind"] {
  if (isSolanaStakingTransactionIntent(intent)) {
    return intent.type as TransactionModel["kind"];
  }
  if (intent.asset.type !== "native") {
    return "token.transfer";
  }
  return "transfer";
}

/**
 * Maps the intent asset type to the Solana token program identifier.
 * Token-2022 assets produce a different instruction variant
 * (transferCheckedWithFee) that affects compute-unit consumption.
 */
function resolveTokenProgramFromAsset(
  asset: TransactionIntent["asset"],
): SolanaTokenProgram | undefined {
  if (asset.type === "native") return undefined;
  if (asset.type === PARSED_PROGRAMS.SPL_TOKEN_2022) return PARSED_PROGRAMS.SPL_TOKEN_2022;
  return PARSED_PROGRAMS.SPL_TOKEN;
}
