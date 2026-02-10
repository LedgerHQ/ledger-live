import type { Operation, Pagination } from "@ledgerhq/coin-framework/api/types";

import { isValidAddress } from "../logic";
import { mapToOperation } from "./mappers";

import type { ESDTToken, MultiversXApiTransaction } from "../types";
import { MultiversXTransferOptions } from "../types";

/** Maximum number of tokens to fetch ESDT transactions for (performance safeguard) */
const MAX_TOKENS_TO_FETCH = 20;

/**
 * API client interface for listOperations function.
 * Extended with ESDT methods (Task 2 - Story 2.2).
 */
interface ApiClient {
  getHistory(address: string, startAt: number): Promise<MultiversXApiTransaction[]>;
  getESDTTokensForAddress(address: string): Promise<ESDTToken[]>;
  getESDTTransactionsForAddress(
    address: string,
    token: string,
    startAt: number,
  ): Promise<MultiversXApiTransaction[]>;
}

/**
 * Deduplicates transactions by txHash, preferring ESDT-marked versions.
 * This handles the case where getHistory() returns ESDT transactions without
 * the transfer field set, and getESDTTransactionsForAddress() returns the same
 * transactions with proper ESDT marking.
 * @param transactions - Array of transactions that may contain duplicates
 * @returns Deduplicated array preferring ESDT-marked transactions
 */
function deduplicateTransactions(
  transactions: MultiversXApiTransaction[],
): MultiversXApiTransaction[] {
  const txMap = new Map<string, MultiversXApiTransaction>();

  for (const [index, tx] of transactions.entries()) {
    const hash = tx.txHash ?? "";
    // Some API responses may omit txHash or return empty string.
    // We still want to keep those transactions (mapToOperation will use "" as id),
    // so we generate a stable unique key for deduplication purposes.
    const key = hash || `__missing_txHash_${index}`;

    const existing = txMap.get(key);
    if (!existing) {
      txMap.set(key, tx);
    } else {
      // Prefer the ESDT-marked version (has transfer field set)
      if (tx.transfer === MultiversXTransferOptions.esdt) {
        txMap.set(key, tx);
      }
    }
  }

  return Array.from(txMap.values());
}

/**
 * Lists historical operations for a MultiversX address with pagination support.
 * Fetches both EGLD native transactions and ESDT token transactions (Story 2.2).
 * Deduplicates transactions that appear in both EGLD and ESDT results.
 *
 * **Sort Order Convention (Story 2.3):**
 * - `order: "desc"` (default): Most recent first (highest block height first)
 * - `order: "asc"`: Oldest first (lowest block height first)
 * - Within same block: Sorted by txHash alphabetically for deterministic ordering
 *
 * @param apiClient - MultiversX API client instance
 * @param address - MultiversX bech32 address
 * @param pagination - Pagination options (limit, minHeight, order, pagingToken)
 * @returns Tuple of [Operation[], string] where string is next cursor
 * @throws Error with descriptive message if address is invalid
 */
export async function listOperations(
  apiClient: ApiClient,
  address: string,
  pagination: Pagination,
): Promise<[Operation[], string]> {
  // Validate address format
  if (!isValidAddress(address)) {
    throw new Error(`Invalid MultiversX address: ${address}`);
  }

  // Extract pagination parameters
  const { limit, minHeight = 0, order = "desc", pagingToken } = pagination;

  // NOTE: minHeight is a block height, but getHistory() uses timestamp.
  // For now, we fetch from timestamp 0 (all history) and filter client-side.
  // Future optimization: implement block height to timestamp conversion.
  const startAt = 0;

  // Fetch EGLD transactions (includes all transactions, some may be ESDT)
  const egldTransactions = await apiClient.getHistory(address, startAt);

  // Fetch ESDT tokens for the account (Subtask 3.1)
  const tokens = await apiClient.getESDTTokensForAddress(address);

  // Limit tokens to fetch for performance (avoid N+1 API call explosion)
  const tokensToFetch = tokens.slice(0, MAX_TOKENS_TO_FETCH);

  // Fetch ESDT transactions for each token in parallel (Subtask 3.2)
  // Using Promise.allSettled for graceful degradation if some token fetches fail
  const tokenTransactionPromises = tokensToFetch.map(token =>
    apiClient.getESDTTransactionsForAddress(address, token.identifier, startAt),
  );
  const tokenTransactionResults = await Promise.allSettled(tokenTransactionPromises);

  // Extract successful results, ignore failed fetches
  const allEsdtTransactions = tokenTransactionResults
    .filter(
      (result): result is PromiseFulfilledResult<MultiversXApiTransaction[]> =>
        result.status === "fulfilled",
    )
    .flatMap(result => result.value);

  // Merge and deduplicate transactions (Subtask 3.3)
  // getHistory returns ALL transactions (including ESDT without transfer field)
  // getESDTTransactionsForAddress returns ESDT with transfer field set
  // Deduplication prefers the ESDT-marked version to ensure correct asset type mapping
  const mergedTransactions = [...egldTransactions, ...allEsdtTransactions];
  const allTransactions = deduplicateTransactions(mergedTransactions);

  // Sort merged transactions by block height with deterministic secondary key (Story 2.3)
  // Primary sort: block height (round or blockHeight property)
  // Secondary sort: txHash for deterministic ordering when block heights are equal
  // This ensures consistent ordering across repeated calls and different JS engines
  const sortedTransactions = [...allTransactions].sort((a, b) => {
    const heightA = a.round ?? a.blockHeight ?? 0;
    const heightB = b.round ?? b.blockHeight ?? 0;

    // Primary sort: by block height
    if (heightA !== heightB) {
      return order === "asc" ? heightA - heightB : heightB - heightA;
    }

    // Secondary sort: by txHash for deterministic ordering within same block
    // txHash is guaranteed unique per transaction and provides consistent comparison
    // Note: Secondary sort is ALWAYS alphabetical ascending regardless of primary sort order
    // This ensures determinism - the order direction only affects block height comparison
    const hashA = a.txHash ?? "";
    const hashB = b.txHash ?? "";
    return hashA.localeCompare(hashB);
  });

  // Apply minHeight filter (filter by block height, not timestamp)
  // minHeight filters out transactions BELOW the specified height, regardless of sort order
  const filteredByHeight = minHeight
    ? sortedTransactions.filter(tx => {
        const height = tx.round ?? tx.blockHeight ?? 0;
        return height >= minHeight;
      })
    : sortedTransactions;

  // Apply cursor-based pagination using pagingToken (Story 2.3 - enhanced cursor format)
  // Cursor format: "{height}:{txHash}" for precise same-block positioning
  // Legacy format (height only) is still supported for backward compatibility
  // This ensures no duplicates or gaps when multiple transactions share the same block height
  let cursorFiltered = filteredByHeight;
  if (pagingToken) {
    const colonIndex = pagingToken.indexOf(":");
    const hasHashComponent = colonIndex >= 0;
    const cursorHeightStr = hasHashComponent ? pagingToken.slice(0, colonIndex) : pagingToken;
    const cursorHash = hasHashComponent ? pagingToken.slice(colonIndex + 1) : null;
    const cursorHeight = parseInt(cursorHeightStr, 10);

    if (!isNaN(cursorHeight)) {
      cursorFiltered = filteredByHeight.filter(tx => {
        const height = tx.round ?? tx.blockHeight ?? 0;
        const hash = tx.txHash ?? "";

        // The sorted order is: primary by height (asc/desc), secondary by txHash (always alphabetical).
        // Cursor points to the last item returned. We need items that come AFTER it in sorted order.
        if (order === "asc") {
          // ASC order: next items have higher height, or same height with higher hash
          if (cursorHash !== null) {
            return height > cursorHeight || (height === cursorHeight && hash > cursorHash);
          }
          return height > cursorHeight;
        } else {
          // DESC order: next items have lower height, or same height with higher hash (secondary is always alphabetical)
          if (cursorHash !== null) {
            return height < cursorHeight || (height === cursorHeight && hash > cursorHash);
          }
          return height < cursorHeight;
        }
      });
    }
  }

  // Apply limit (client-side pagination)
  const limitedTransactions = limit ? cursorFiltered.slice(0, limit) : cursorFiltered;

  // Map transactions to Operation objects
  const operations = limitedTransactions.map(tx => mapToOperation(tx, address));

  // Generate next cursor (Story 2.3 - enhanced format with txHash)
  // Format: "{height}:{txHash}" for precise same-block positioning
  // If we have fewer results than the limit, there are no more pages
  let nextCursor = "";
  if (limit && limitedTransactions.length === limit && cursorFiltered.length > limit) {
    const lastTx = limitedTransactions[limitedTransactions.length - 1];
    const lastHeight = lastTx.round ?? lastTx.blockHeight ?? 0;
    const lastHash = lastTx.txHash ?? "";
    nextCursor = `${lastHeight}:${lastHash}`;
  }

  return [operations, nextCursor];
}
