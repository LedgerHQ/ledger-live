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
  pageSize: number;
  heightLimit: number;
  continueIterations: boolean;
  apiNextCursor?: number;
  accumulator: Operation[];
};

async function operationsFromHeight(
  address: string,
  start: number,
): Promise<[Operation[], number]> {
  async function fetchNextPage(state: PaginationState): Promise<PaginationState> {
    const [operations, apiNextCursor] = await listOperations(address, {
      limit: state.pageSize,
      lastId: state.apiNextCursor,
    });
    const filteredOperations = operations.filter(op => op.block.height >= state.heightLimit);
    const isTruncated = operations.length !== filteredOperations.length;
    const continueIteration = !(apiNextCursor === -1 || isTruncated);
    const accumulated = state.accumulator.concat(filteredOperations);
    return {
      ...state,
      continueIterations: continueIteration,
      apiNextCursor: apiNextCursor,
      accumulator: accumulated,
    };
  }

  const firstState: PaginationState = {
    pageSize: 1,
    heightLimit: start,
    continueIterations: true,
    accumulator: [],
  };

  let state = await fetchNextPage(firstState);
  while (state.continueIterations) {
    state = await fetchNextPage(state);
  }
  return [state.accumulator, state.apiNextCursor ?? 0];
}

async function operations(
  address: string,
  { limit, start }: Pagination,
): Promise<[Operation[], number]> {
  return start ? operationsFromHeight(address, start) : listOperations(address, { limit: limit });
}
