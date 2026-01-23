import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import type { AleoPublicTransaction } from "../types/api";
import { apiClient } from "./api";

function limitTransactions(
  transactions: AleoPublicTransaction[],
  limit: number,
): AleoPublicTransaction[] {
  return transactions.length > limit ? transactions.slice(0, limit) : transactions;
}

function getLastTransactionCursor(transactions: AleoPublicTransaction[]): string | null {
  return transactions.at(-1)?.block_number.toString() ?? null;
}

function hasReachedMinHeight(
  transactions: AleoPublicTransaction[],
  minBlockHeight: number,
): boolean {
  return transactions.some(tx => tx.block_number < minBlockHeight);
}

export async function fetchAccountTransactionsFromHeight({
  currency,
  address,
  fetchAllPages,
  minBlockHeight,
  cursor,
  limit = 50,
  order = "asc",
}: {
  currency: CryptoCurrency;
  address: string;
  fetchAllPages: boolean;
  minBlockHeight: number;
  cursor?: string;
  limit?: number;
  order?: "asc" | "desc";
}): Promise<{
  transactions: AleoPublicTransaction[];
  nextCursor: string | null;
}> {
  const transactions: AleoPublicTransaction[] = [];
  let currentCursor = cursor ?? null;
  let hasMorePages = true;

  while (hasMorePages) {
    const page = await apiClient.getAccountPublicTransactions({
      currency,
      address,
      limit,
      order,
      ...(currentCursor && { cursor: currentCursor }),
    });

    const nextCursorBlockNumber = page.next_cursor?.block_number.toString() ?? null;
    hasMorePages = nextCursorBlockNumber !== null;

    const recentTxs = page.transactions.filter(tx => tx.block_number >= minBlockHeight);
    transactions.push(...recentTxs);

    // stop if DESC order hit the min height boundary
    if (order === "desc" && hasReachedMinHeight(page.transactions, minBlockHeight)) {
      const limitedTxs = limitTransactions(transactions, limit);

      return {
        transactions: fetchAllPages ? transactions : limitedTxs,
        nextCursor: null,
      };
    }

    // pagination mode: check if we don't have more than requested
    if (!fetchAllPages && transactions.length >= limit) {
      const limitedTxs = limitTransactions(transactions, limit);
      const nextCursor = getLastTransactionCursor(limitedTxs);

      return {
        transactions: limitedTxs,
        nextCursor,
      };
    }

    // no more pages - return what we have
    if (!hasMorePages) {
      const limitedTxs = limitTransactions(transactions, limit);

      return {
        transactions: fetchAllPages ? transactions : limitedTxs,
        nextCursor: null,
      };
    }

    currentCursor = nextCursorBlockNumber;
  }

  // should not be reached, just a type guard
  throw new Error("aleo: unexpected end of loop in fetchAccountTransactionsFromHeight");
}
