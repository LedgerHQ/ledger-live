import type {
  Api,
  Operation,
  Pagination,
  TransactionIntent,
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

async function craft(transactionIntent: TransactionIntent<StellarToken>): Promise<string> {
  const fees = await estimateFees();
  const supplement = transactionIntent.asset
    ? {
        assetCode: transactionIntent.asset.assetCode,
        assetIssuer: transactionIntent.asset.assetIssuer,
      }
    : {};
  const tx = await craftTransaction(
    { address: transactionIntent.sender },
    {
      type: transactionIntent.type,
      recipient: transactionIntent.recipient,
      amount: transactionIntent.amount,
      fee: fees,
      assetCode: supplement?.assetCode,
      assetIssuer: supplement?.assetIssuer,
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
