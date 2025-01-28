import type {
  Api,
  Operation,
  Transaction as ApiTransaction,
  Pagination,
} from "@ledgerhq/coin-framework/api/index";
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
import { XrpOperation } from "../types";

export function createApi(config: XrpConfig): Api {
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
  pageSize: number;
  minHeight: number;
  continueIterations: boolean;
  apiNextCursor?: string;
  accumulator: XrpOperation[];
};

async function operationsFromHeight(address: string, minHeight: number): Promise<XrpOperation[]> {
  async function fetchNextPage(state: PaginationState): Promise<PaginationState> {
    const [operations, apiNextCursor] = await listOperations(address, {
      limit: state.pageSize,
      minHeight: state.minHeight,
    });
    const continueIteration = apiNextCursor !== "";
    const accumulated = state.accumulator.concat(operations);
    return {
      ...state,
      continueIterations: continueIteration,
      apiNextCursor: apiNextCursor,
      accumulator: accumulated,
    };
  }

  const firstState: PaginationState = {
    pageSize: 400, // must be large enough to avoid unnecessary calls to the underlying explorer
    minHeight: minHeight,
    continueIterations: true,
    accumulator: [],
  };

  let state = await fetchNextPage(firstState);
  while (state.continueIterations) {
    state = await fetchNextPage(state);
  }
  return state.accumulator;
}

async function operations(address: string, { start }: Pagination): Promise<[Operation[], string]> {
  const minHeight = start ? start : 0;
  const ops = await operationsFromHeight(address, minHeight);
  return [
    ops.map(op => {
      const { simpleType, blockHash, blockTime, blockHeight, ...rest } = op;
      return {
        ...rest,
        block: {
          height: blockHeight,
          hash: blockHash,
          time: blockTime,
        },
      };
    }),
    "",
  ];
}
