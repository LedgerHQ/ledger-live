import BIPPath from "bip32-path";

/**
 * Harden every path segment (Solana/Ed25519) then parse with bip32-path.
 * Fail closed on truncated/garbage segments that bip32-path would silently shorten.
 */
export function resolveHardenedBip32Path(originalPath: string): number[] {
  const path = originalPath
    .split("/")
    .map(value => (value.endsWith("'") || value.endsWith("h") || value.endsWith("H") ? value : value + "'"))
    .join("/");
  const __segments = path.split("/");
  for (const [__i, segment] of __segments.entries()) {
    // bip32-path accepts and strips a leading "m" root; mirror that.
    if (__i === 0 && /^m$/i.test(segment)) {
      continue;
    }
    // Reject empty/non-numeric/truncated segments (e.g. "NOTAINDEX", "12abc'").
    // bip32-path previously truncated "12abc'" to index 12 and dropped hardening.
    if (!/^\d+[hH']?$/.test(segment)) {
      throw new Error(`Invalid BIP32 path segment: ${segment}`);
    }
    if (parseInt(segment, 10) > 0x7fffffff) {
      throw new Error(`Invalid BIP32 path segment: ${segment}`);
    }
  }
  return BIPPath.fromString(path).toPathArray();
}
