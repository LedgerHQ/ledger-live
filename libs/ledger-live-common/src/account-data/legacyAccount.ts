/**
 * Conversions between an AccountDescriptor and the fields the legacy account model keeps for the
 * same identity (currency, seed identifier, derivation mode, index).
 *
 * Legacy to descriptor is lossless for any currency supported by getDerivationModesForCurrency.
 * Descriptor to legacy is lossless for supported currencies; what the descriptor does not carry
 * (the fresh address, which moves) is left to the caller.
 *
 * Path building and parsing delegate entirely to the derivation helpers from
 * the framework derivation module: no hardcoded coin types or path tables.
 */

import { getCryptoCurrencyById } from "@ledgerhq/ledger-wallet-framework/currencies";
import {
  getDerivationScheme,
  runDerivationScheme,
  runAccountDerivationScheme,
  getDerivationModesForCurrency,
  derivationModeSupportsIndex,
  asDerivationMode,
} from "@ledgerhq/ledger-wallet-framework/derivation";
import {
  accountKeyOf,
  networkFromCurrencyId,
  currencyIdFromNetwork,
  type AccountDescriptor,
  type UtxoAccountDescriptor,
  type AddressAccountDescriptor,
} from "@domain/entity-account-descriptor";

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
  return /^[xyztuv]pub/.test(seedIdentifier) || /^[xyztuv]prv/.test(seedIdentifier);
}

/**
 * Normalize a derivation scheme output to descriptor path format:
 * prepend "m/" and replace apostrophe hardened markers with "h" (shell-safe).
 */
function toDescriptorPath(schemePath: string): string {
  return "m/" + schemePath.replaceAll("'", "h");
}

/**
 * Normalize a descriptor path segment back to the scheme format used by derivation.ts:
 * strip the "m/" prefix and replace "h" hardened markers with "'".
 */
function fromDescriptorPath(descriptorPath: string): string {
  return descriptorPath.replace(/^m\//, "").replaceAll("h", "'");
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

/** The legacy account fields that carry an account's identity. */
export type LegacyAccountIdentity = {
  currencyId: string;
  seedIdentifier: string;
  derivationMode: string;
  index: number;
};

/**
 * The descriptor of a legacy account.
 * Throws UnsupportedFamilyError if the derivation scheme cannot be determined.
 */
export function fromLegacyAccount(legacy: LegacyAccountIdentity): AccountDescriptor {
  const network = networkFromCurrencyId(legacy.currencyId);
  const currency = getCryptoCurrencyById(legacy.currencyId);
  const derivationMode = asDerivationMode(legacy.derivationMode);
  const scheme = getDerivationScheme({ derivationMode, currency });

  if (isXpub(legacy.seedIdentifier)) {
    const path = toDescriptorPath(
      runAccountDerivationScheme(scheme, currency, { account: legacy.index }),
    );
    return {
      purpose: "account",
      version: "1",
      type: "utxo",
      network,
      xpub: legacy.seedIdentifier,
      path,
    } satisfies UtxoAccountDescriptor;
  }

  const path = toDescriptorPath(
    runDerivationScheme(scheme, { coinType: currency.coinType }, { account: legacy.index }),
  );
  return {
    purpose: "account",
    version: "1",
    type: "address",
    network,
    address: legacy.seedIdentifier,
    path,
  } satisfies AddressAccountDescriptor;
}

/**
 * The legacy identity of a descriptor. `id` is `js:2:{currencyId}:{seedIdentifier}:{derivationMode}`.
 * Throws UnsupportedFamilyError if no known derivation mode matches the descriptor path.
 */
export function toLegacyAccount(
  descriptor: AccountDescriptor,
): LegacyAccountIdentity & { id: string } {
  const currencyId = currencyIdFromNetwork(descriptor.network);
  const currency = getCryptoCurrencyById(currencyId);
  const normalizedPath = fromDescriptorPath(descriptor.path);
  const seedIdentifier = accountKeyOf(descriptor);

  const modes = getDerivationModesForCurrency(currency);
  for (const mode of modes) {
    const scheme = getDerivationScheme({ derivationMode: mode, currency });
    const index = matchSchemeToPath(scheme, currency.coinType, normalizedPath);
    if (index === null) continue;
    if (!derivationModeSupportsIndex(mode, index)) continue;

    return {
      id: `js:2:${currencyId}:${seedIdentifier}:${mode}`,
      currencyId,
      seedIdentifier,
      derivationMode: mode,
      index,
    };
  }

  const tried = modes.map(m => `"${m}"`).join(", ");
  throw new UnsupportedFamilyError(
    `No derivation mode for ${currencyId} matches path "${descriptor.path}". Tried: ${tried}`,
  );
}
