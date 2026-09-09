import BIPPath from "bip32-path";

/**
 * Parse a BIP32 path with bip32-path, failing closed on truncated/garbage segments
 * that bip32-path would silently shorten (e.g. "12abc'" → 12).
 */
export function resolveBip32Path(originalPath: string): number[] {
  const __segments = originalPath.split("/");
  for (const [__i, segment] of __segments.entries()) {
    // bip32-path accepts and strips a leading "m" root; mirror that.
    if (__i === 0 && /^m$/i.test(segment)) {
      continue;
    }
    if (!/^\d+[hH']?$/.test(segment)) {
      throw new Error(`Invalid BIP32 path segment: ${segment}`);
    }
    if (parseInt(segment, 10) > 0x7fffffff) {
      throw new Error(`Invalid BIP32 path segment: ${segment}`);
    }
  }
  return BIPPath.fromString(originalPath).toPathArray();
}
