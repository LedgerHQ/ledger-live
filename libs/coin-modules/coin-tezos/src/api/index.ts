import {
  IncorrectTypeError,
  Operation,
  Pagination,
  type Api,
  type Transaction as ApiTransaction,
} from "@ledgerhq/coin-framework/api/index";
import coinConfig, { type TezosConfig } from "../config";
import {
  broadcast,
  combine,
  craftTransaction,
  estimateFees,
  getBalance,
  listOperations,
  lastBlock,
  rawEncode,
} from "../logic";
import api from "../network/tzkt";
import { log } from "@ledgerhq/logs";

export function createApi(config: TezosConfig): Api {
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

function isTezosTransactionType(type: string): type is "send" | "delegate" | "undelegate" {
  return ["send", "delegate", "undelegate"].includes(type);
}
async function craft(
  address: string,
  { type, recipient, amount, fee }: ApiTransaction,
): Promise<string> {
  if (!isTezosTransactionType(type)) {
    throw new IncorrectTypeError(type);
  }

  const { contents } = await craftTransaction(
    { address },
    { recipient, amount, type, fee: { fees: fee.toString() } },
  );
  return rawEncode(contents);
}

async function estimate(addr: string, amount: bigint): Promise<bigint> {
  const accountInfo = await api.getAccountByAddress(addr);
  if (accountInfo.type !== "user") throw new Error("unexpected account type");

  const estimatedFees = await estimateFees({
    account: {
      address: addr,
      revealed: accountInfo.revealed,
      balance: BigInt(accountInfo.balance),
      xpub: accountInfo.publicKey,
    },
    transaction: { mode: "send", recipient: addr, amount: amount },
  });
  return estimatedFees.estimatedFees;
}

type PaginationState = {
  readonly pageSize: number;
  readonly maxIterations: number; // a security to avoid infinite loop
  currentIteration: number;
  readonly minHeight: number;
  continueIterations: boolean;
  nextCursor?: string;
  accumulator: Operation[];
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
): Promise<[Operation[], string]> {
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
): Promise<[Operation[], string]> {
  return operationsFromHeight(address, minHeight);
}
