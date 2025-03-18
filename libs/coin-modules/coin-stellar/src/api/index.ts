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
import { ListOperationsOptions } from "../logic/listOperations";
import { StellarToken } from "../types";

export function createApi(config: StellarConfig): Api<StellarToken> {
  coinConfig.setCoinConfig(() => ({ ...config, status: { type: "active" } }));

  return {
    broadcast,
    combine: compose,
    craftTransaction: craft,
    estimateFees: () => estimateFees(),
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

async function operations(
  address: string,
  { minHeight }: Pagination,
): Promise<[Operation<StellarToken>[], string]> {
  return operationsFromHeight(address, minHeight);
}

type PaginationState = {
  readonly pageSize: number;
  readonly heightLimit: number;
  continueIterations: boolean;
  apiNextCursor?: string;
  accumulator: Operation<StellarToken>[];
};

async function operationsFromHeight(
  address: string,
  minHeight: number,
): Promise<[Operation<StellarToken>[], string]> {
  const state: PaginationState = {
    pageSize: 200,
    heightLimit: minHeight,
    continueIterations: true,
    accumulator: [],
  };

  // unfortunately, the stellar API does not support an option to filter by min height
  // so the only strategy to get ALL operations is to iterate over all of them in descending order
  // until we reach the desired minHeight
  while (state.continueIterations) {
    const options: ListOperationsOptions = { limit: state.pageSize, order: "desc" };
    if (state.apiNextCursor) {
      options.cursor = state.apiNextCursor;
    }
    const [operations, nextCursor] = await listOperations(address, options);
    const filteredOperations = operations.filter(op => op.tx.block.height >= state.heightLimit);
    state.accumulator.push(...filteredOperations);
    state.apiNextCursor = nextCursor;
    state.continueIterations = operations.length === filteredOperations.length && nextCursor !== "";
  }

  return [state.accumulator, state.apiNextCursor ? state.apiNextCursor : ""];
}
