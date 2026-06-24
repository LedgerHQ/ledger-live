import { MarketItemResponse } from "./types";

/** Minimal shape needed to rank a market-search result. */
export type MarketSearchCandidate = Pick<MarketItemResponse, "id" | "ticker" | "name" | "ledgerIds">;

/**
 * Picks the best market-search result for a free-text term.
 *
 * The `/v3/markets?filter=` endpoint can return several rows sharing a ticker (e.g. many "wlfi"
 * tokens), most of them junk with no Ledger support. We keep only rows that carry `ledgerIds`
 * (renderable in-app), then prefer an exact ticker match, then an exact name match, and otherwise
 * fall back to the first usable row — the API already returns results market-cap descending, so
 * that is the highest-cap candidate.
 *
 * @returns the chosen result, or `undefined` when no usable (ledger-backed) row exists.
 */
export function pickBestMarketSearchMatch<T extends MarketSearchCandidate>(
  results: T[],
  term: string,
): T | undefined {
  const normalized = term.trim().toLowerCase();
  const usable = results.filter(result => result.ledgerIds?.length);
  if (usable.length === 0) return undefined;

  return (
    usable.find(result => result.ticker?.toLowerCase() === normalized) ??
    usable.find(result => result.name?.toLowerCase() === normalized) ??
    usable[0]
  );
}
