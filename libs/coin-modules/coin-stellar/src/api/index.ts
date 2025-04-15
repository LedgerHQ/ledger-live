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
  lastBlock,
  listOperations,
} from "../logic";
import { ListOperationsOptions } from "../logic/listOperations";
import { StellarAsset } from "../types";
import { LedgerAPI4xx } from "@ledgerhq/errors";
import { log } from "@ledgerhq/logs";
export function createApi(config: StellarConfig): Api<StellarAsset> {
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

type TransactionIntentExtra = {
  memoType?: string | null | undefined;
  memoValue?: string | null | undefined;
};

async function craft(
  transactionIntent: TransactionIntent<StellarAsset>,
  customFees?: bigint,
): Promise<string> {
  const fees = customFees !== undefined ? customFees : await estimateFees();
  const extra = transactionIntent as TransactionIntentExtra;
  const tx = await craftTransaction(
    { address: transactionIntent.sender },
    {
      type: transactionIntent.type,
      recipient: transactionIntent.recipient,
      amount: transactionIntent.amount,
      fee: fees,
      ...(transactionIntent.asset.type === "token"
        ? {
            assetCode: transactionIntent.asset.assetCode,
            assetIssuer: transactionIntent.asset.assetIssuer,
          }
        : {}),
      memoType: extra.memoType,
      memoValue: extra.memoValue,
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
): Promise<[Operation<StellarAsset>[], string]> {
  return operationsFromHeight(address, minHeight);
}

type PaginationState = {
  readonly pageSize: number;
  readonly heightLimit: number;
  continueIterations: boolean;
  apiNextCursor?: string;
  accumulator: Operation<StellarAsset>[];
};

async function operationsFromHeight(
  address: string,
  minHeight: number,
): Promise<[Operation<StellarAsset>[], string]> {
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
    try {
      const [operations, nextCursor] = await listOperations(address, options);
      const filteredOperations = operations.filter(op => op.tx.block.height >= state.heightLimit);
      state.accumulator.push(...filteredOperations);
      state.apiNextCursor = nextCursor;
      state.continueIterations =
        operations.length === filteredOperations.length && nextCursor !== "";
    } catch (e: unknown) {
      if (e instanceof LedgerAPI4xx && (e as unknown as { status: number }).status === 429) {
        log("coin:stellar", "(api/operations): TooManyRequests, retrying in 4s");
        await new Promise(resolve => setTimeout(resolve, 4000));
      } else {
        throw e;
      }
    }
  }

  return [state.accumulator, state.apiNextCursor ? state.apiNextCursor : ""];
}
