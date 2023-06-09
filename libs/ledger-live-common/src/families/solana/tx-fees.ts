import { Account } from "@ledgerhq/types-live";
import { ChainAPI } from "./api";
import { buildTransactionWithAPI } from "./js-buildTransaction";
import createTransaction from "./js-createTransaction";
import { Transaction, TransactionModel } from "./types";
import { assertUnreachable } from "./utils";
import { VersionedTransaction as OnChainTransaction } from "@solana/web3.js";
import { log } from "@ledgerhq/logs";

export async function estimateTxFee(
  api: ChainAPI,
  account: Account,
  kind: TransactionModel["kind"]
) {
  const tx = createDummyTx(account, kind);
  const [onChainTx] = await buildTransactionWithAPI(account, tx, api);

  const fee = await api.getFeeForMessage(onChainTx.message);

  if (typeof fee !== "number") {
    log("error", `api.getFeeForMessage returned invalid fee: <${fee}>`);
    // TEMP HACK: sometimes fee is not a number, retrying with a next blockhash
    return retryWithNewBlockhash(api, onChainTx);
  }
  return fee;
}

const createDummyTx = (account: Account, kind: TransactionModel["kind"]) => {
  switch (kind) {
    case "transfer":
      return createDummyTransferTx(account);
    case "stake.createAccount":
      return createDummyStakeCreateAccountTx(account);
    case "stake.delegate":
      return createDummyStakeDelegateTx(account);
    case "stake.undelegate":
      return createDummyStakeUndelegateTx(account);
    case "stake.withdraw":
      return createDummyStakeWithdrawTx(account);
    case "stake.split":
    case "token.createATA":
    case "token.transfer":
      throw new Error(`not implemented for <${kind}>`);
    default:
      return assertUnreachable(kind);
  }
};

const createDummyTransferTx = (account: Account): Transaction => {
  return {
    ...createTransaction({} as any),
    model: {
      kind: "transfer",
      uiState: {},
      commandDescriptor: {
        command: {
          kind: "transfer",
          amount: 0,
          recipient: account.freshAddress,
          sender: account.freshAddress,
        },
        ...commandDescriptorCommons,
      },
    },
  };
};

const createDummyStakeCreateAccountTx = (account: Account): Transaction => {
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
          fromAccAddress: account.freshAddress,
          seed: "",
          stakeAccAddress: randomAddresses[1],
          stakeAccRentExemptAmount: 0,
        },
        ...commandDescriptorCommons,
      },
    },
  };
};

const createDummyStakeDelegateTx = (account: Account): Transaction => {
  return {
    ...createTransaction({} as any),
    model: {
      kind: "stake.delegate",
      uiState: {} as any,
      commandDescriptor: {
        command: {
          kind: "stake.delegate",
          authorizedAccAddr: account.freshAddress,
          stakeAccAddr: randomAddresses[0],
          voteAccAddr: randomAddresses[1],
        },
        ...commandDescriptorCommons,
      },
    },
  };
};

const createDummyStakeUndelegateTx = (account: Account): Transaction => {
  return {
    ...createTransaction({} as any),
    model: {
      kind: "stake.undelegate",
      uiState: {} as any,
      commandDescriptor: {
        command: {
          kind: "stake.undelegate",
          authorizedAccAddr: account.freshAddress,
          stakeAccAddr: randomAddresses[0],
        },
        ...commandDescriptorCommons,
      },
    },
  };
};

const createDummyStakeWithdrawTx = (account: Account): Transaction => {
  return {
    ...createTransaction({} as any),
    model: {
      kind: "stake.withdraw",
      uiState: {} as any,
      commandDescriptor: {
        command: {
          kind: "stake.withdraw",
          amount: 0,
          authorizedAccAddr: account.freshAddress,
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

async function retryWithNewBlockhash(
  api: ChainAPI,
  onChainTx: OnChainTransaction
) {
  if (onChainTx.message.recentBlockhash === undefined) {
    throw new Error("expected recentBlockhash");
  }

  onChainTx.message.recentBlockhash = await waitNextBlockhash(
    api,
    onChainTx.message.recentBlockhash
  );

  const fee = await api.getFeeForMessage(onChainTx.message);

  if (typeof fee !== "number") {
    throw new Error(
      `unexpected fee: <${fee}>, after retry with a new blockhash`
    );
  }

  return fee;
}

function sleep(durationMS: number): Promise<void> {
  return new Promise((res) => setTimeout(res, durationMS));
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
