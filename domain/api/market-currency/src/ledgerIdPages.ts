import { MARKET_LIST_PAGE_SIZES, type MarketListPageSize } from "@domain/entity-market-currency";
import type { MarketItemResponse } from "./schema";

/** Largest page `/v3/markets` serves: a ledger id lookup never asks for more per request. */
export const MAX_MARKETS_PAGE_SIZE: MarketListPageSize =
  MARKET_LIST_PAGE_SIZES[MARKET_LIST_PAGE_SIZES.length - 1];

/** The smallest allowed page size that holds `count` items. */
export function marketPageSize(count: number): MarketListPageSize {
  return MARKET_LIST_PAGE_SIZES.find(size => size >= count) ?? MAX_MARKETS_PAGE_SIZE;
}

export function chunkLedgerIds(ledgerIds: string[]): string[][] {
  const chunks: string[][] = [];
  for (let start = 0; start < ledgerIds.length; start += MAX_MARKETS_PAGE_SIZE) {
    chunks.push(ledgerIds.slice(start, start + MAX_MARKETS_PAGE_SIZE));
  }
  return chunks;
}

function isMarketItemList(data: unknown): data is MarketItemResponse[] {
  return Array.isArray(data);
}

/**
 * The markets of the pages that succeeded. A page that failed, or whose body is not a list, is
 * skipped; `undefined` when no page succeeded.
 */
export function marketsFromPages(
  pages: readonly { error?: unknown; data?: unknown }[],
): MarketItemResponse[] | undefined {
  const markets: MarketItemResponse[] = [];
  let succeeded = false;
  for (const page of pages) {
    if (page.error || !isMarketItemList(page.data)) continue;
    succeeded = true;
    markets.push(...page.data);
  }
  return succeeded ? markets : undefined;
}
