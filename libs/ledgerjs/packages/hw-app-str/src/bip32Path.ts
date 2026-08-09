import BIPPath from "bip32-path";

/**
 * Harden every path segment (Stellar/Ed25519) then parse with bip32-path.
 * Fail closed on truncated/garbage segments that bip32-path would silently shorten.
 */
export function resolveHardenedBip32Path(originalPath: string): number[] {
  const path = originalPath
    .split("/")
    .map(value =>
      value.endsWith("'") || value.endsWith("h") || value.endsWith("H") ? value : `${value}'`,
    )
    .join("/");
  for (const segment of path.split("/")) {
    if (!/^\d+[hH']?$/.test(segment)) {
      throw new Error(`Invalid BIP32 path segment: ${segment}`);
    }
  }
  return BIPPath.fromString(path).toPathArray();
}
