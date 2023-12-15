import { ChainAPI } from "./api";
import { buildTransactionWithAPI } from "./js-buildTransaction";
import createTransaction from "./js-createTransaction";
import { Transaction, TransactionModel } from "./types";
import { assertUnreachable } from "./utils";
import { VersionedTransaction as OnChainTransaction } from "@solana/web3.js";
import { log } from "@ledgerhq/logs";

export async function estimateTxFee(
  api: ChainAPI,
  address: string,
  kind: TransactionModel["kind"],
) {
  const tx = createDummyTx(address, kind);
  const [onChainTx] = await buildTransactionWithAPI(address, tx, api);

  const fee = await api.getFeeForMessage(onChainTx.message);

  if (typeof fee !== "number") {
    log("error", `api.getFeeForMessage returned invalid fee: <${fee}>`);
    // TEMP HACK: sometimes fee is not a number, retrying with a next blockhash
    return retryWithNewBlockhash(api, onChainTx);
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
    case "stake.split":
    case "token.createATA":
    case "token.transfer":
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

const createDummyStakeCreateAccountTx = (address: string): Transaction => {
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
            voteAccAddress: randomAddresses[0],
          },
          fromAccAddress: address,
          seed: "",
          stakeAccAddress: randomAddresses[1],
          stakeAccRentExemptAmount: 0,
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
          toAccAddr: randomAddresses[1],
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

  const fee = await api.getFeeForMessage(onChainTx.message);

  if (typeof fee !== "number") {
    throw new Error(`unexpected fee: <${fee}>, after retry with a new blockhash`);
  }

  return fee;
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
    if (blockhash !== currentBlockhash) {
      log("info", "got a new blockhash");
      return blockhash;
    }
    log("info", "got same blockhash");
  }

  throw new Error("next blockhash timeout");
}
