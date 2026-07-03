import { findCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";

export type LedgerAssetPath = Readonly<{
  currencyId: string;
  assetId: string;
  ledgerIds?: string[];
}>;

const SEGMENT_ALLOWLIST = /^[A-Za-z0-9._:()!~-]+$/;

function decodePathSegment(segment: string): string | null {
  try {
    return decodeURIComponent(segment);
  } catch {
    return null;
  }
}

/**
 * Decodes and validates a single path segment, preserving its original case. Ledger token ids can
 * be case-sensitive (e.g. Stellar asset codes / issuer addresses), so segment case is kept and only
 * the parent currency id is lowercased later for resolution.
 */
function validatePathSegment(segment: string): string | null {
  const decoded = decodePathSegment(segment)?.trim();
  return decoded && SEGMENT_ALLOWLIST.test(decoded) ? decoded : null;
}

/** Removes leading/trailing "/" without a backtracking-prone regex (deeplink input is untrusted). */
function stripSlashes(value: string): string {
  let start = 0;
  let end = value.length;
  while (start < end && value[start] === "/") start++;
  while (end > start && value[end - 1] === "/") end--;
  return value.slice(start, end);
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
 * token whose Ledger id is the full path. The parent coin must be a known Ledger crypto currency;
 * token segments keep their original case so case-sensitive ids resolve correctly.
 */
export function parseLedgerAssetPath(path: string | null | undefined): LedgerAssetPath | null {
  if (!path) return null;

  const core = stripSlashes(path.trim());
  if (!core) return null;

  const segments: string[] = [];
  for (const rawSegment of core.split("/")) {
    const segment = validatePathSegment(rawSegment);
    if (!segment) return null;
    segments.push(segment);
  }

  const currencyId = resolveLedgerCryptoCurrencyId(segments[0]);
  if (!currencyId) return null;

  if (segments.length === 1) {
    return {
      currencyId,
      assetId: currencyId,
    };
  }

  const assetId = [currencyId, ...segments.slice(1)].join("/");
  return {
    currencyId,
    assetId,
    ledgerIds: [assetId],
  };
}
