import { findCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";

export type LedgerAssetPath = Readonly<{
  currencyId: string;
  assetId: string;
  ledgerIds?: string[];
}>;

function decodePathSegment(segment: string): string | null {
  try {
    return decodeURIComponent(segment);
  } catch {
    return null;
  }
}

function normalizeAssetPathSegment(segment: string): string | null {
  const decoded = decodePathSegment(segment);
  const normalized = decoded?.trim().toLowerCase();
  return normalized && /^[a-z0-9._:()!~-]+$/.test(normalized) ? normalized : null;
}

export function resolveLedgerCryptoCurrencyId(
  currencyId: string | null | undefined,
): string | null {
  if (!currencyId || currencyId.trim() === "") return null;

  return findCryptoCurrencyById(currencyId.trim().toLowerCase())?.id ?? null;
}

/**
 * Parses a Ledger asset path into either a coin id or a full Ledger token id.
 *
 * `ethereum` targets the Ethereum coin. `ethereum/erc20/usd_tether__erc20_` targets the
 * token whose Ledger id is the full path. The parent coin must be a known Ledger crypto currency.
 */
export function parseLedgerAssetPath(path: string | null | undefined): LedgerAssetPath | null {
  if (!path) return null;

  const trimmedPath = path.trim().replace(/^\/+|\/+$/g, "");
  if (!trimmedPath) return null;

  const rawSegments = trimmedPath.split("/");
  if (rawSegments.some(segment => !segment.trim())) return null;

  const normalizedSegments: string[] = [];
  for (const segment of rawSegments) {
    const normalizedSegment = normalizeAssetPathSegment(segment);
    if (!normalizedSegment) return null;
    normalizedSegments.push(normalizedSegment);
  }

  const currencyId = resolveLedgerCryptoCurrencyId(normalizedSegments[0]);
  if (!currencyId) return null;

  if (normalizedSegments.length === 1) {
    return {
      currencyId,
      assetId: currencyId,
    };
  }

  const assetId = normalizedSegments.join("/");
  return {
    currencyId,
    assetId,
    ledgerIds: [assetId],
  };
}
