import type {
  Api,
  Operation,
  Pagination,
  Transaction as ApiTransaction,
} from "@ledgerhq/coin-framework/api/index";
import coinConfig, { type StellarConfig } from "../config";
import {
  broadcast,
  combine,
  craftTransaction,
  estimateFees,
  getBalance,
  listOperations,
  lastBlock,
} from "../logic";

export function createApi(config: StellarConfig): Api {
  coinConfig.setCoinConfig(() => ({ ...config, status: { type: "active" } }));

  return {
    broadcast,
    combine: compose,
    craftTransaction: craft,
    estimateFees,
    getBalance,
    lastBlock,
    listOperations: operations,
  };
}

type Supplement = {
  assetCode?: string | undefined;
  assetIssuer?: string | undefined;
  memoType?: string | null | undefined;
  memoValue?: string | null | undefined;
};
function isSupplement(supplement: unknown): supplement is Supplement {
  return typeof supplement === "object";
}
async function craft(address: string, transaction: ApiTransaction): Promise<string> {
  const supplement = isSupplement(transaction.supplement)
    ? {
        assetCode: transaction.supplement?.assetCode,
        assetIssuer: transaction.supplement?.assetIssuer,
        memoType: transaction.supplement?.memoType,
        memoValue: transaction.supplement?.memoValue,
      }
    : {};
  const tx = await craftTransaction(
    { address },
    {
      ...transaction,
      assetCode: supplement?.assetCode,
      assetIssuer: supplement?.assetIssuer,
      memoType: supplement?.memoType,
      memoValue: supplement?.memoValue,
    },
  );
  return tx.xdr;
}

function compose(tx: string, signature: string, pubkey?: string): string {
  if (!pubkey) {
    throw new Error("Missing pubkey");
  }
  return combine(tx, signature, pubkey);
}

type PaginationState = {
  pageSize?: number;
  heightLimit: number;
  continueIterations: boolean;
  apiNextCursor?: string;
  accumulator: Operation[];
};

async function operationsFromHeight(
  address: string,
  start: number,
): Promise<[Operation[], string]> {
  const state: PaginationState = {
    pageSize: 100,
    heightLimit: start,
    continueIterations: true,
    accumulator: [],
  };

  while (state.continueIterations) {
    const options: { limit?: number; cursor?: string } = {};
    if (state.apiNextCursor) {
      options.cursor = state.apiNextCursor;
    }
    if (state.pageSize) {
      options.limit = state.pageSize;
    }
    const [operations, nextCursor] = await listOperations(address, options);
    const filteredOperations = operations.filter(op => op.block.height >= state.heightLimit);
    state.accumulator.push(...filteredOperations);
    state.apiNextCursor = nextCursor;
    state.continueIterations = operations.length === filteredOperations.length;
  }

  return [state.accumulator, state.apiNextCursor ?? ""];
}

const operations = async (address: string, { start }: Pagination): Promise<[Operation[], string]> =>
  operationsFromHeight(address, start ?? 0);
