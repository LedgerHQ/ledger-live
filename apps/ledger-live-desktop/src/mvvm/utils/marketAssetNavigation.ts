import { findCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";

/** `/asset` when Wallet 4.0 aggregated assets is on, else `/market` (market deeplinks). */
export function getAssetsDetailPathPrefix(
  shouldDisplayAggregatedAssets: boolean,
): "/asset" | "/market" {
  return shouldDisplayAggregatedAssets ? "/asset" : "/market";
}

function encodePathSegment(segment: string): string {
  try {
    return encodeURIComponent(decodeURIComponent(segment));
  } catch {
    return encodeURIComponent(segment);
  }
}

/** Wallet 4.0 market list row / trending tile → asset or legacy market detail. */
export function getMarketOrAssetDetailPath(
  currencyId: string,
  shouldDisplayAggregatedAssets: boolean,
): string {
  const segment = encodePathSegment(currencyId);
  return shouldDisplayAggregatedAssets ? `/asset/${segment}` : `/market/${segment}`;
}

/** Asset deeplink and legacy asset-centric routes. */
export function getAssetDetailPath(currencyId: string): string {
  return `/asset/${encodePathSegment(currencyId)}`;
}

/**
 * Resolves a deeplink path segment to a canonical Ledger crypto currency id.
 * Used when Wallet 4.0 aggregated assets is off (legacy market/asset screens).
 */
export function resolveLegacyCryptoCurrencyId(path: string): string | null {
  const normalizedPath = path.trim().toLowerCase();
  if (!normalizedPath) return null;
  return findCryptoCurrencyById(normalizedPath)?.id ?? null;
}
