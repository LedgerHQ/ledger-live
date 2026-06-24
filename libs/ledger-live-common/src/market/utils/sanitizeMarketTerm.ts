/** Upper bound for a market deeplink segment; legitimate coin ids / slugs / names are far shorter. */
export const MAX_MARKET_TERM_LENGTH = 64;

/**
 * Sanitizes a free-text market deeplink segment (a coin id, token ticker, name, or CoinGecko
 * slug) before it is used as a route param or in a market API query. The charset is constrained
 * to what legitimate identifiers use so a deeplink cannot smuggle arbitrary content into a URL.
 *
 * @returns the sanitized term, or `null` when nothing usable remains.
 */
export function sanitizeMarketTerm(raw: string | null | undefined): string | null {
  if (!raw || typeof raw !== "string") return null;

  const sanitized = raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9 ._-]/g, "") // tickers, slugs (hedera-hashgraph) and names with spaces
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, MAX_MARKET_TERM_LENGTH);

  return sanitized || null;
}
