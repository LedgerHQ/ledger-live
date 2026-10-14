import { retry } from "@ledgerhq/coin-module-framework/promises";
import { ApiResponseTransaction } from "../types";
import { API_BASE } from "./config";
import { httpError, READ_RETRY } from "./retryPolicy";

// The indexer rejects `before` and `after` together (HTTP 400), so the type allows only one.
type PageDirection = { after: number; before?: never } | { before?: number; after?: never };

// The indexer's own maximum page size, and the size used whenever a caller doesn't ask for one.
export const MAX_PAGE_LIMIT = 500;

type GetTransactionsOptions = PageDirection & {
  // Page size, passed through as-is: the indexer answers 422 outside 1–MAX_PAGE_LIMIT, so callers
  // validate it first (listOperations rejects non-positive values and caps at MAX_PAGE_LIMIT).
  limit?: number;
};

/**
 * Fetch one indexer page (up to 500 txs) of an address's history.
 * - `{ after }`: txs newer than that block time (ms), walking forward; continue with `nextPageAfter`.
 * - `{ before }`: txs older than that block time (ms), walking backward; continue with `nextPageBefore`.
 * - no option: the newest page; continue backward with `nextPageBefore`.
 */
export const getTransactions = (
  address: string,
  options?: GetTransactionsOptions,
): Promise<{
  transactions: ApiResponseTransaction[];
  nextPageAfter: string | null;
  nextPageBefore: string | null;
}> => {
  const before = options?.before;
  const after = options?.after;
  const limit = options?.limit ?? MAX_PAGE_LIMIT;

  const url = new URL(`/addresses/${encodeURIComponent(address)}/full-transactions-page`, API_BASE);
  url.searchParams.set("resolve_previous_outpoints", "light");
  url.searchParams.set("limit", String(limit));

  if (before) {
    url.searchParams.set("before", String(before));
  }

  if (after) {
    url.searchParams.set("after", String(after));
  }

  return retry(async () => {
    const response = await fetch(url, { headers: { Accept: "application/json" } });

    if (!response.ok) {
      throw httpError("Network response was not ok.", response.status);
    }

    const nextPageBefore = response.headers.get("X-Next-Page-Before") || null;
    const nextPageAfter = response.headers.get("X-Next-Page-After") || null;
    const transactions = await response.json();

    return { transactions, nextPageBefore, nextPageAfter };
  }, READ_RETRY);
};
