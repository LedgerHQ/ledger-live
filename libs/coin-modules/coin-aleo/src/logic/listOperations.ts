import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import type { Pagination } from "@ledgerhq/coin-framework/api/types";
import { promiseAllBatched } from "@ledgerhq/live-promise";
import type { AleoOperation } from "../types/bridge";
import { fetchAccountTransactionsFromHeight, parseOperation } from "../network/utils";

export async function listOperations({
  currency,
  address,
  ledgerAccountId,
  pagination,
  fetchAllPages,
}: {
  currency: CryptoCurrency;
  address: string;
  ledgerAccountId: string;
  pagination: Pagination;
  fetchAllPages: boolean;
}): Promise<{
  operations: AleoOperation[];
  nextCursor: string | null;
}> {
  const operations: AleoOperation[] = [];

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
    const parsedOperation = await parseOperation({
      currency,
      rawTx,
      address,
      ledgerAccountId,
    });

    operations.push(parsedOperation);
  });

  return {
    operations,
    nextCursor: result.nextCursor,
  };
}
