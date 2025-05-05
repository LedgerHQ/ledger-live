import type {
  Api,
  FeeEstimation,
  Operation,
  Pagination,
  TransactionIntent,
} from "@ledgerhq/coin-framework/api/index";
import { log } from "@ledgerhq/logs";
import coinConfig, { type XrpConfig } from "../config";
import {
  broadcast,
  combine,
  craftTransaction,
  estimateFees,
  getBalance,
  getNextValidSequence,
  lastBlock,
  listOperations,
  MemoInput,
} from "../logic";
import { ListOperationsOptions, XrpAsset } from "../types";

export function createApi(config: XrpConfig): Api<XrpAsset, TransactionIntentExtra> {
  coinConfig.setCoinConfig(() => ({ ...config, status: { type: "active" } }));

  return {
    broadcast,
    combine,
    craftTransaction: craft,
    estimateFees: estimate,
    getBalance,
    lastBlock,
    listOperations: operations,
  };
}

export type TransactionIntentExtra = {
  destinationTag?: number | null | undefined;
  memos?: MemoInput[];
};

async function craft(
  transactionIntent: TransactionIntent<XrpAsset, TransactionIntentExtra>,
  customFees?: bigint,
): Promise<string> {
  const nextSequenceNumber = await getNextValidSequence(transactionIntent.sender);
  const estimatedFees = customFees !== undefined ? customFees : (await estimateFees()).fee;
  const tx = await craftTransaction(
    { address: transactionIntent.sender, nextSequenceNumber },
    {
      recipient: transactionIntent.recipient,
      amount: transactionIntent.amount,
      fee: estimatedFees,
      destinationTag: transactionIntent.destinationTag,
      memos: transactionIntent.memos,
    },
  );
  return tx.serializedTransaction;
}

async function estimate(): Promise<FeeEstimation> {
  const estimation = await estimateFees();
  return { value: estimation.fee };
}

type PaginationState = {
  readonly pageSize: number; // must be large enough to avoid unnecessary calls to the underlying explorer
  readonly maxIterations: number; // a security to avoid infinite loop
  currentIteration: number;
  readonly minHeight: number;
  continueIterations: boolean;
  apiNextCursor?: string;
  accumulator: Operation<XrpAsset>[];
};

async function operationsFromHeight(
  address: string,
  minHeight: number,
): Promise<[Operation<XrpAsset>[], string]> {
  async function fetchNextPage(state: PaginationState): Promise<PaginationState> {
    const options: ListOperationsOptions = {
      limit: state.pageSize,
      minHeight: state.minHeight,
      order: "asc",
    };
    if (state.apiNextCursor) {
      options.token = state.apiNextCursor;
    }
    const [operations, apiNextCursor] = await listOperations(address, options);
    const newCurrentIteration = state.currentIteration + 1;
    let continueIteration = true;
    if (apiNextCursor === "") {
      continueIteration = false;
    } else if (newCurrentIteration >= state.maxIterations) {
      log("coin:xrp", "(api/operations): max iterations reached", state.maxIterations);
      continueIteration = false;
    }
    const accumulated = state.accumulator.concat(operations);
    return {
      ...state,
      currentIteration: newCurrentIteration,
      continueIterations: continueIteration,
      apiNextCursor: apiNextCursor,
      accumulator: accumulated,
    };
  }

  const firstState: PaginationState = {
    pageSize: 200,
    maxIterations: 10,
    currentIteration: 0,
    minHeight: minHeight,
    continueIterations: true,
    accumulator: [],
  };

  let state = await fetchNextPage(firstState);
  while (state.continueIterations) {
    state = await fetchNextPage(state);
  }
  return [state.accumulator, state.apiNextCursor ?? ""];
}

async function operations(
  address: string,
  { minHeight }: Pagination,
): Promise<[Operation<XrpAsset>[], string]> {
  // TODO token must be implemented properly (waiting ack from the design document)
  return await operationsFromHeight(address, minHeight);
}
