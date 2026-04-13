/**
 * Bidirectional adapters between AccountDescriptorV0 (WalletSync / live-common) and
 * AccountDescriptorV1 (ADR format).
 *
 * V0 → V1 is lossless for any currency supported by getDerivationModesForCurrency.
 * V1 → V0 is lossless for supported currencies; `freshAddress` is always set to ""
 *   because V1 does not store it — callers should sync via BridgeAdapter if needed.
 *
 * Path building and parsing delegate entirely to the derivation helpers from
 * @ledgerhq/ledger-wallet-framework/derivation — no hardcoded coin types or path tables.
 */

import { getCryptoCurrencyById } from "@ledgerhq/cryptoassets/currencies";
import {
  getDerivationScheme,
  runDerivationScheme,
  runAccountDerivationScheme,
  getDerivationModesForCurrency,
  derivationModeSupportsIndex,
  asDerivationMode,
} from "@ledgerhq/ledger-wallet-framework/derivation";
import type { AccountDescriptorV0 } from "./v0";
import type { AccountDescriptorV1, UtxoAccountDescriptorV1, AccountBasedDescriptorV1 } from "./v1";
import { networkFromCurrencyId, currencyIdFromNetwork } from "./network";

// ---------------------------------------------------------------------------
// Public error type
// ---------------------------------------------------------------------------

export class UnsupportedFamilyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UnsupportedFamilyError";
  }
}

// ---------------------------------------------------------------------------
// Path helpers
// ---------------------------------------------------------------------------

function isXpub(seedIdentifier: string): boolean {
  return /^[xyz]pub/.test(seedIdentifier) || /^[xyz]prv/.test(seedIdentifier);
}

/**
 * Normalize a derivation scheme output to V1 path format:
 * prepend "m/" and replace apostrophe hardened markers with "h" (shell-safe).
 */
function toV1Path(schemePath: string): string {
  return "m/" + schemePath.replaceAll("'", "h");
}

/**
 * Normalize a V1 path segment back to the scheme format used by derivation.ts:
 * strip the "m/" prefix and replace "h" hardened markers with "'".
 */
function fromV1Path(v1Path: string): string {
  return v1Path.replace(/^m\//, "").replaceAll("h", "'");
}

type SegmentMatch = { matched: false } | { matched: true; accountIndex?: number };

/** Match one scheme segment against one path segment. Returns the match result. */
function matchOneSegment(s: string, p: string, coinType: number): SegmentMatch {
  const sHard = s.endsWith("'");
  const pHard = p.endsWith("'");
  const sBase = sHard ? s.slice(0, -1) : s;
  const pBase = pHard ? p.slice(0, -1) : p;

  if (sBase === "<coin_type>") {
    if (sHard !== pHard || Number.parseInt(pBase, 10) !== coinType) return { matched: false };
    return { matched: true };
  }
  if (sBase === "<account>") {
    if (sHard !== pHard) return { matched: false };
    const n = Number.parseInt(pBase, 10);
    if (Number.isNaN(n)) return { matched: false };
    return { matched: true, accountIndex: n };
  }
  if (sBase === "<node>" || sBase === "<address>") {
    // non-hardened placeholder — verify it is non-hardened in path too
    if (pHard) return { matched: false };
    return { matched: true };
  }
  // literal segment — must match exactly
  if (s !== p) return { matched: false };
  return { matched: true };
}

/**
 * Try to match a raw derivation scheme template against a normalized path (uses "'").
 * Returns the account index if the path matches the scheme, or null if it does not.
 *
 * Scheme segments like "<coin_type>'", "<account>'", "<node>", "<address>" are matched
 * structurally; all other segments are matched as exact strings.
 *
 * UTXO paths are shorter than the full scheme (they omit /<node>/<address>).
 * Remaining trailing scheme segments must be "<node>" or "<address>" to allow a match.
 */
function matchSchemeToPath(
  scheme: string,
  coinType: number,
  normalizedPath: string,
): number | null {
  const sSegs = scheme.split("/");
  const pSegs = normalizedPath.split("/");

  let accountIndex: number | null = null;
  let si = 0;
  let pi = 0;

  while (si < sSegs.length && pi < pSegs.length) {
    const result = matchOneSegment(sSegs[si], pSegs[pi], coinType);
    if (!result.matched) return null;
    if (result.accountIndex !== undefined) accountIndex = result.accountIndex;
    si++;
    pi++;
  }

  // Allow UTXO paths that end before scheme's <node>/<address> placeholders
  while (si < sSegs.length) {
    const remaining = sSegs[si];
    const base = remaining.endsWith("'") ? remaining.slice(0, -1) : remaining;
    if (base !== "<node>" && base !== "<address>") return null;
    si++;
  }

  // If path has extra segments beyond the scheme, no match
  if (pi < pSegs.length) return null;

  return accountIndex ?? 0;
}

// ---------------------------------------------------------------------------
// toV1 — AccountDescriptorV0 → AccountDescriptorV1
// ---------------------------------------------------------------------------

/**
 * Convert a V0 (WalletSync / live-common) account descriptor to the V1 ADR format.
 * Throws UnsupportedFamilyError if the derivation scheme cannot be determined.
 */
export function toV1(v0: AccountDescriptorV0): AccountDescriptorV1 {
  const network = networkFromCurrencyId(v0.currencyId);
  const currency = getCryptoCurrencyById(v0.currencyId);
  const derivationMode = asDerivationMode(v0.derivationMode);
  const scheme = getDerivationScheme({ derivationMode, currency });

  if (isXpub(v0.seedIdentifier)) {
    const path = toV1Path(runAccountDerivationScheme(scheme, currency, { account: v0.index }));
    return {
      purpose: "account",
      version: "1",
      type: "utxo",
      network,
      xpub: v0.seedIdentifier,
      path,
    } satisfies UtxoAccountDescriptorV1;
  }

  const path = toV1Path(
    runDerivationScheme(scheme, { coinType: currency.coinType }, { account: v0.index }),
  );
  return {
    purpose: "account",
    version: "1",
    type: "address",
    network,
    address: v0.seedIdentifier,
    path,
  } satisfies AccountBasedDescriptorV1;
}

// ---------------------------------------------------------------------------
// toV0 — AccountDescriptorV1 → AccountDescriptorV0
// ---------------------------------------------------------------------------

/**
 * Convert a V1 (ADR) account descriptor back to the V0 (WalletSync / live-common) format.
 *
 * `freshAddress` is set to "" — if needed call `BridgeAdapter.getFreshAddress()` after syncing.
 * `id` is reconstructed as `js:2:{currencyId}:{seedIdentifier}:{derivationMode}`.
 *
 * Throws UnsupportedFamilyError if no known derivation mode matches the V1 path.
 */
export function toV0(v1: AccountDescriptorV1): AccountDescriptorV0 {
  const currencyId = currencyIdFromNetwork(v1.network);
  const currency = getCryptoCurrencyById(currencyId);
  const normalizedPath = fromV1Path(v1.path);
  const seedIdentifier = v1.type === "utxo" ? v1.xpub : v1.address;

  const modes = getDerivationModesForCurrency(currency);
  for (const mode of modes) {
    const scheme = getDerivationScheme({ derivationMode: mode, currency });
    const index = matchSchemeToPath(scheme, currency.coinType, normalizedPath);
    if (index === null) continue;
    if (!derivationModeSupportsIndex(mode, index)) continue;

    return {
      id: `js:2:${currencyId}:${seedIdentifier}:${mode}`,
      currencyId,
      freshAddress: "",
      seedIdentifier,
      derivationMode: mode,
      index,
    };
  }

  const tried = modes.map(m => `"${m}"`).join(", ");
  throw new UnsupportedFamilyError(
    `No derivation mode for ${currencyId} matches path "${v1.path}". Tried: ${tried}`,
  );
}
