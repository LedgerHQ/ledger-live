import {
  type Balance,
  IncorrectTypeError,
  type Operation,
  type Pagination,
} from "@ledgerhq/coin-framework/api/index";
import { log } from "@ledgerhq/logs";
import coinConfig, { type TezosConfig } from "../config";
import {
  broadcast,
  combine,
  craftTransaction,
  estimateFees,
  getBalance,
  lastBlock,
  listOperations,
  rawEncode,
} from "../logic";
import api from "../network/tzkt";
import type { TezosOperationMode } from "../types";
import type { TezosApi, TezosAsset, TezosFeeEstimation, TezosTransactionIntent } from "./types";

export function createApi(config: TezosConfig): TezosApi {
  coinConfig.setCoinConfig(() => ({ ...config, status: { type: "active" } }));

  return {
    broadcast,
    combine,
    craftTransaction: craft,
    estimateFees: estimate,
    getBalance: balance,
    lastBlock,
    listOperations: operations,
  };
}

function isTezosTransactionType(type: string): type is "send" | "delegate" | "undelegate" {
  return ["send", "delegate", "undelegate"].includes(type);
}

async function balance(address: string): Promise<Balance<TezosAsset>[]> {
  const value = await getBalance(address);
  return [
    {
      value,
      asset: { type: "native" },
    },
  ];
}

async function craft(
  transactionIntent: TezosTransactionIntent,
  customFees?: bigint,
): Promise<string> {
  if (!isTezosTransactionType(transactionIntent.type)) {
    throw new IncorrectTypeError(transactionIntent.type);
  }
  const fee =
    customFees !== undefined
      ? { fees: customFees.toString() }
      : await estimate(transactionIntent).then(fees => ({
          fees: fees.value.toString(),
          gasLimit: fees.parameters?.gasLimit?.toString(),
          storageLimit: fees.parameters?.storageLimit?.toString(),
        }));
  const { contents } = await craftTransaction(
    { address: transactionIntent.sender.address },
    {
      type: transactionIntent.type,
      recipient: transactionIntent.recipient,
      amount: transactionIntent.amount,
      fee,
    },
  );
  return rawEncode(contents);
}

async function estimate(transactionIntent: TezosTransactionIntent): Promise<TezosFeeEstimation> {
  const senderAccountInfo = await api.getAccountByAddress(transactionIntent.sender.address);
  if (senderAccountInfo.type !== "user") throw new Error("unexpected account type");

  const {
    estimatedFees: value,
    gasLimit,
    storageLimit,
    taquitoError,
  } = await estimateFees({
    account: {
      address: transactionIntent.sender.address,
      revealed: senderAccountInfo.revealed,
      balance: BigInt(senderAccountInfo.balance),
      xpub: transactionIntent.sender.xpub ?? senderAccountInfo.publicKey,
    },
    transaction: {
      mode: transactionIntent.type as TezosOperationMode,
      recipient: transactionIntent.recipient,
      amount: transactionIntent.amount,
    },
  });

  if (taquitoError !== undefined) {
    throw new Error(`Fees estimation failed: ${taquitoError}`);
  }

  return {
    value,
    parameters: {
      gasLimit,
      storageLimit,
    },
  };
}

type PaginationState = {
  readonly pageSize: number;
  readonly maxIterations: number; // a security to avoid infinite loop
  currentIteration: number;
  readonly minHeight: number;
  continueIterations: boolean;
  nextCursor?: string;
  accumulator: Operation<TezosAsset>[];
};

async function fetchNextPage(address: string, state: PaginationState): Promise<PaginationState> {
  const [operations, newNextCursor] = await listOperations(address, {
    limit: state.pageSize,
    token: state.nextCursor,
    sort: "Ascending",
    minHeight: state.minHeight,
  });
  const newCurrentIteration = state.currentIteration + 1;
  let continueIteration = newNextCursor !== "";
  if (newCurrentIteration >= state.maxIterations) {
    log("coin:tezos", "(api/operations): max iterations reached", state.maxIterations);
    continueIteration = false;
  }
  const accumulated = operations.concat(state.accumulator);
  return {
    ...state,
    continueIterations: continueIteration,
    currentIteration: newCurrentIteration,
    nextCursor: newNextCursor,
    accumulator: accumulated,
  };
}

async function operationsFromHeight(
  address: string,
  start: number,
): Promise<[Operation<TezosAsset>[], string]> {
  const firstState: PaginationState = {
    pageSize: 200,
    maxIterations: 10,
    currentIteration: 0,
    minHeight: start,
    continueIterations: true,
    accumulator: [],
  };

  let state = await fetchNextPage(address, firstState);
  while (state.continueIterations) {
    state = await fetchNextPage(address, state);
  }
  return [state.accumulator, state.nextCursor || ""];
}

async function operations(
  address: string,
  { minHeight }: Pagination,
): Promise<[Operation<TezosAsset>[], string]> {
  return operationsFromHeight(address, minHeight);
}
