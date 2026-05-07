import URL from "url";

import { getEnv } from "@ledgerhq/live-env";
import network from "@ledgerhq/live-network";

export type FetchSpotPricesArgs = {
  currencyIds: Array<string | undefined>;
  counterValue: string;
};

const SPOT_PRICE_TTL_MS = 30_000;

type SpotPriceCacheEntry = { price: number; expiresAt: number };

// Cached per `{baseURL}|{counterValue}|{currencyId}`: baseURL keeps
// staging/prod data isolated, counterValue keeps quote currencies isolated.
// Only successful fetches populate entries.
const spotPriceCache = new Map<string, SpotPriceCacheEntry>();

function cacheKey(baseURL: string, counterValue: string, currencyId: string): string {
  return `${baseURL}|${counterValue}|${currencyId}`;
}

/** Test-only reset hook. */
export function __resetSpotPriceCacheForTests(): void {
  spotPriceCache.clear();
}

/**
 * Fetch Ledger spot prices for the given currency ids against a single
 * counter-value (e.g. `{ ethereum: 3200 }` for `counterValue: "usd"`).
 * Cached per currency id for {@link SPOT_PRICE_TTL_MS}; best-effort —
 * returns `{}` on failure and never throws so a countervalues outage
 * cannot block the quotes pipeline.
 */
export async function fetchSpotPrices(args: FetchSpotPricesArgs): Promise<Record<string, number>> {
  const currencyIds = dedupeCurrencyIds(args.currencyIds);
  if (currencyIds.length === 0) return {};

  const baseURL = getEnv("LEDGER_COUNTERVALUES_API");
  const counterValue = args.counterValue.toLowerCase();

  const { cached, missing } = readFromCache(currencyIds, baseURL, counterValue);
  if (missing.length === 0) return cached;

  const fetched = await fetchAndCache(missing, baseURL, counterValue);
  return { ...cached, ...fetched };
}

function dedupeCurrencyIds(ids: Array<string | undefined>): string[] {
  return Array.from(
    new Set(ids.filter((id): id is string => typeof id === "string" && id.length > 0)),
  );
}

/** Split ids into cache hits and misses; evict expired entries as we go. */
function readFromCache(
  currencyIds: string[],
  baseURL: string,
  counterValue: string,
): { cached: Record<string, number>; missing: string[] } {
  const now = Date.now();
  const cached: Record<string, number> = {};
  const missing: string[] = [];

  for (const id of currencyIds) {
    const key = cacheKey(baseURL, counterValue, id);
    const entry = spotPriceCache.get(key);
    if (entry && entry.expiresAt > now) {
      cached[id] = entry.price;
    } else {
      if (entry) spotPriceCache.delete(key);
      missing.push(id);
    }
  }

  return { cached, missing };
}

/**
 * Fetch the missing prices and populate the cache. Best-effort: any
 * failure resolves to `{}` so a countervalues outage never blocks the
 * caller.
 */
async function fetchAndCache(
  missing: string[],
  baseURL: string,
  counterValue: string,
): Promise<Record<string, number>> {
  try {
    const url = URL.format({
      pathname: `${baseURL}/v3/spot/simple`,
      query: { to: counterValue, froms: missing.join(",") },
    });
    const { data } = await network<Record<string, number>>({ method: "GET", url });
    if (!data || typeof data !== "object") return {};

    const expiresAt = Date.now() + SPOT_PRICE_TTL_MS;
    const fetched: Record<string, number> = {};
    for (const [id, price] of Object.entries(data)) {
      if (typeof price === "number") {
        spotPriceCache.set(cacheKey(baseURL, counterValue, id), { price, expiresAt });
        fetched[id] = price;
      }
    }
    return fetched;
  } catch {
    return {};
  }
}
