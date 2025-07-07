import coinConfig, { type SuiConfig } from "../config";
import {
  estimateFees,
  combine,
  broadcast,
  getBalance,
  listOperations,
  lastBlock,
  craftTransaction,
} from "../logic";
import type { SuiAsset } from "./types";
import {
  AlpacaApi,
  FeeEstimation, Operation, Pagination,
  TransactionIntent
} from "@ledgerhq/coin-framework/api/index";
import errors_1 from "@ledgerhq/errors";
import logs_1 from "@ledgerhq/logs";

export function createApi(config: SuiConfig): AlpacaApi<SuiAsset> {
  coinConfig.setCoinConfig(() => ({ ...config, status: { type: "active" } }));

  return {
    broadcast,
    combine,
    craftTransaction: craft,
    estimateFees: estimate,
    getBalance,
    lastBlock,
    listOperations: list,
  };
}

async function craft(transactionIntent: TransactionIntent<SuiAsset>): Promise<string> {
  const { unsigned } = await craftTransaction(transactionIntent);

  return Buffer.from(unsigned).toString("hex");
}

async function estimate(transactionIntent: TransactionIntent<SuiAsset>): Promise<FeeEstimation> {
  const fees = await estimateFees(transactionIntent);
  return { value: fees };
}

async function list(address: string, pagination: Pagination): Promise<[Operation<SuiAsset>[], string]> {
  return operationsFromHeight(address, pagination.minHeight)
}

type PaginationState = {
  readonly heightLimit: number;
  continueIterations: boolean;
  apiNextCursor?: string;
  accumulator: Operation<SuiAsset>[];
};

async function operationsFromHeight(
  address: string,
  minHeight: number,
): Promise<[Operation<SuiAsset>[], string]> {
  const state: PaginationState = {
    heightLimit: minHeight,
    continueIterations: true,
    accumulator: [],
  };

  while (state.continueIterations) {
    const option = state.apiNextCursor
      ? { minHeight: minHeight, cursor: state.apiNextCursor }
      : { minHeight: minHeight };
    const [operations, nextCursor] = await listOperations(address, option);
    const opsFromHeight = operations.filter(op => op.tx.block.height >= minHeight);
    state.accumulator.push(...opsFromHeight);
    state.apiNextCursor = nextCursor;
    // The API makes 2 calls "IN" and "OUT" so even if we started filtering a few elements, we may still have more txs to fetch on one of the two calls.
    // We can only stop when we've filtered all txs.
    state.continueIterations = nextCursor !== "" && opsFromHeight.length > 0;
  }

  return [state.accumulator, state.apiNextCursor ? state.apiNextCursor : ""];
}
