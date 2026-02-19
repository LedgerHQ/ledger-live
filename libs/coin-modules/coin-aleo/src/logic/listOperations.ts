import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import type { Operation, Pagination } from "@ledgerhq/coin-framework/api/types";
import { promiseAllBatched } from "@ledgerhq/live-promise";
import type { AleoOperation } from "../types/bridge";
import { enrichTransaction, fetchAccountTransactionsFromHeight } from "../network/utils";
import { toAlpacaOperation, toBridgeOperation } from "./utils";

interface Params {
  currency: CryptoCurrency;
  address: string;
  pagination: Pagination;
}

interface BridgeParams extends Params {
  mode: "bridge";
  ledgerAccountId: string;
}

interface AlpacaParams extends Params {
  mode: "alpaca";
}

type Result<T> = {
  readonly operations: T[];
  readonly nextCursor: string | null;
};

export async function listOperations(params: BridgeParams): Promise<Result<AleoOperation>>;
export async function listOperations(params: AlpacaParams): Promise<Result<Operation>>;
export async function listOperations(
  params: BridgeParams | AlpacaParams,
): Promise<Result<AleoOperation | Operation>> {
  const { mode, currency, address, pagination } = params;
  const operations: Array<AleoOperation | Operation> = [];
  const fetchAllPages = mode === "bridge";

  const result = await fetchAccountTransactionsFromHeight({
    currency,
    address,
    fetchAllPages,
    minBlockHeight: pagination.minHeight,
    ...(pagination.lastPagingToken && { cursor: pagination.lastPagingToken }),
    ...(pagination.limit && { limit: pagination.limit }),
    ...(pagination.order && { order: pagination.order }),
  });

  await promiseAllBatched(2, result.transactions, async rawTx => {
    const enrichedTx = await enrichTransaction({ currency, rawTx });

    if (mode === "alpaca") {
      operations.push(toAlpacaOperation(enrichedTx, address));
    } else {
      operations.push(toBridgeOperation(params.ledgerAccountId, enrichedTx, address));
    }
  });

  return {
    operations,
    nextCursor: result.nextCursor,
  };
}
