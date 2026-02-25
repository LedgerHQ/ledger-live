import { log } from "@ledgerhq/logs";
import { VersionedTransaction as OnChainTransaction } from "@solana/web3.js";
import { buildTransactionWithAPI } from "./buildTransaction";
import createTransaction from "./createTransaction";
import { ChainAPI } from "./network";
import { PARSED_PROGRAMS } from "./network/chain/program/constants";
import { getStakeAccountAddressWithSeed } from "./network/chain/web3";
import { UserInputType } from "./signer";
import { Transaction, TransactionModel } from "./types";
import { LEDGER_VALIDATOR_DEFAULT, assertUnreachable } from "./utils";

const DEFAULT_TX_FEE = 5000;

export async function estimateTxFee(
  api: ChainAPI,
  address: string,
  kind: TransactionModel["kind"],
) {
  const tx = await createDummyTx(address, kind);
  const [onChainTx] = await buildTransactionWithAPI(address, tx, api);

  let fee = await api.getFeeForMessage(onChainTx.message);

  if (typeof fee !== "number") {
    // Sometimes getFeeForMessage doesn't return valid fees, because onChainTx.message.recentBlockhash
    // is outdated --> retrying with a next blockhash
    log("debug", `Solana api.getFeeForMessage returned invalid fee: <${fee}>`);
    fee = await retryWithNewBlockhash(api, onChainTx);
  }

  if (typeof fee !== "number") {
    log(
      "error",
      `Solana unexpected fee: <${fee}>, after retry with a new blockhash. Fallback to the default.`,
    );
    // If still failing, fallback to a default fees value
    fee = DEFAULT_TX_FEE;
  }
  return fee;
}

const createDummyTx = (address: string, kind: TransactionModel["kind"]) => {
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
      return createDummyTokenTransferTx(address);
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
    ...createTransaction({} as any),
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
    ...createTransaction({} as any),
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
    ...createTransaction({} as any),
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
    ...createTransaction({} as any),
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
    ...createTransaction({} as any),
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

const createDummyTokenTransferTx = (address: string): Transaction => {
  return {
    ...createTransaction({} as any),
    model: {
      kind: "token.transfer",
      uiState: {} as any,
      commandDescriptor: {
        command: {
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
          tokenProgram: PARSED_PROGRAMS.SPL_TOKEN,
        },
        ...commandDescriptorCommons,
      },
    },
  };
};

const createDummyTokenApproveTx = (address: string): Transaction => {
  return {
    ...createTransaction({} as any),
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
    ...createTransaction({} as any),
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

// pregenerate for better caching
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
