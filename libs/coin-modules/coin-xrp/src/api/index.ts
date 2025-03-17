import type {
  Api,
  Operation,
  Transaction as ApiTransaction,
  Pagination,
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
} from "../logic";
import { ListOperationsOptions } from "../types";

export function createApi(config: XrpConfig): Api<void> {
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

async function craft(address: string, transaction: ApiTransaction): Promise<string> {
  const nextSequenceNumber = await getNextValidSequence(address);
  const tx = await craftTransaction({ address, nextSequenceNumber }, transaction);
  return tx.serializedTransaction;
}

async function estimate(_addr: string, _amount: bigint): Promise<bigint> {
  const fees = await estimateFees();
  return fees.fee;
}

type PaginationState = {
  readonly pageSize: number; // must be large enough to avoid unnecessary calls to the underlying explorer
  readonly maxIterations: number; // a security to avoid infinite loop
  currentIteration: number;
  readonly minHeight: number;
  continueIterations: boolean;
  apiNextCursor?: string;
  accumulator: Operation<void>[];
};

async function operationsFromHeight(
  address: string,
  minHeight: number,
): Promise<[Operation<void>[], string]> {
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
): Promise<[Operation<void>[], string]> {
  // TODO token must be implemented properly (waiting ack from the design document)
  return await operationsFromHeight(address, minHeight);
}
