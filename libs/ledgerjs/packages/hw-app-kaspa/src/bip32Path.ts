import BIP32Path from "bip32-path";

/**
 * Parse a BIP32 path with bip32-path, failing closed on truncated/garbage segments
 * that bip32-path would silently shorten (e.g. "12abc'" → 12).
 */
export function resolveBip32Path(originalPath: string): number[] {
  for (const segment of originalPath.split("/")) {
    if (!/^\d+[hH']?$/.test(segment)) {
      throw new Error(`Invalid BIP32 path segment: ${segment}`);
    }
  }
  return BIP32Path.fromString(originalPath).toPathArray();
}
